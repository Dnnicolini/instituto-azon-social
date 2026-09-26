<?php

namespace App\Services;

use App\Models\Project;
use App\Models\ProjectApplication;
use Illuminate\Database\Eloquent\Builder;
use Symfony\Component\HttpFoundation\StreamedResponse;
use ZipArchive;

class ProjectApplicationExporter
{
    /** @param Builder<ProjectApplication> $query */
    public function csv(Project $project, Builder $query): StreamedResponse
    {
        $fields = $project->registrationForm?->fields?->reject->isDisplayOnly() ?? collect();
        $filename = 'inscricoes-'.$project->slug.'-'.now()->format('Ymd-His').'.csv';

        return response()->streamDownload(function () use ($query, $fields): void {
            $output = fopen('php://output', 'wb');
            throw_unless(is_resource($output), \RuntimeException::class, 'Não foi possível iniciar a exportação.');
            fwrite($output, "\xEF\xBB\xBF");
            fputcsv($output, array_merge(['Protocolo', 'Nome', 'E-mail', 'CPF', 'Status', 'Enviada em'], $fields->pluck('label')->all()), ';');
            $query->with(['answers.field'])->orderBy('id')->chunkById(500, function ($applications) use ($output, $fields): void {
                foreach ($applications as $application) {
                    $answers = $application->answers->keyBy('field_id');
                    $row = array_merge([
                        $application->protocol, $application->applicant_name, $application->applicant_email,
                        $application->applicant_cpf, $application->status->label(), $application->submitted_at?->format('d/m/Y H:i:s'),
                    ], $fields->map(function ($field) use ($answers): string {
                        $value = $answers->get($field->id)?->value;

                        return is_array($value) ? implode(', ', $value) : (string) $value;
                    })->all());
                    fputcsv($output, array_map(fn (mixed $value): string => $this->safeSpreadsheetValue($value), $row), ';');
                }
            });
            fclose($output);
        }, $filename, ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    /** @param Builder<ProjectApplication> $query */
    public function xlsx(Project $project, Builder $query): StreamedResponse
    {
        $fields = $project->registrationForm?->fields?->reject->isDisplayOnly() ?? collect();
        $rows = [array_merge(['Protocolo', 'Nome', 'E-mail', 'CPF', 'Status', 'Enviada em'], $fields->pluck('label')->all())];
        $query->with(['answers.field'])->orderBy('id')->chunkById(500, function ($applications) use (&$rows, $fields): void {
            foreach ($applications as $application) {
                $answers = $application->answers->keyBy('field_id');
                $rows[] = array_merge([
                    $application->protocol, $application->applicant_name, $application->applicant_email,
                    $application->applicant_cpf, $application->status->label(), $application->submitted_at?->format('Y-m-d H:i:s'),
                ], $fields->map(function ($field) use ($answers): string {
                    $value = $answers->get($field->id)?->value;

                    return is_array($value) ? implode(', ', $value) : (string) $value;
                })->all());
            }
        });

        $temporary = tempnam(sys_get_temp_dir(), 'azon-xlsx-');
        throw_unless(is_string($temporary), \RuntimeException::class, 'Não foi possível criar a exportação.');
        $zip = new ZipArchive;
        throw_unless($zip->open($temporary, ZipArchive::CREATE | ZipArchive::OVERWRITE) === true, \RuntimeException::class, 'Não foi possível criar a exportação.');
        $zip->addFromString('[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>');
        $zip->addFromString('_rels/.rels', '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>');
        $zip->addFromString('xl/workbook.xml', '<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Inscrições" sheetId="1" r:id="rId1"/></sheets></workbook>');
        $zip->addFromString('xl/_rels/workbook.xml.rels', '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>');
        $xmlRows = '';
        foreach ($rows as $rowIndex => $row) {
            $cells = '';
            foreach (array_values($row) as $columnIndex => $value) {
                $reference = $this->columnName($columnIndex + 1).($rowIndex + 1);
                $escaped = htmlspecialchars((string) $value, ENT_XML1 | ENT_QUOTES, 'UTF-8');
                $cells .= '<c r="'.$reference.'" t="inlineStr"><is><t xml:space="preserve">'.$escaped.'</t></is></c>';
            }
            $xmlRows .= '<row r="'.($rowIndex + 1).'">'.$cells.'</row>';
        }
        $zip->addFromString('xl/worksheets/sheet1.xml', '<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>'.$xmlRows.'</sheetData></worksheet>');
        $zip->close();

        return response()->streamDownload(function () use ($temporary): void {
            readfile($temporary);
            @unlink($temporary);
        }, 'inscricoes-'.$project->slug.'-'.now()->format('Ymd-His').'.xlsx', ['Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']);
    }

    private function columnName(int $number): string
    {
        $name = '';
        while ($number > 0) {
            $number--;
            $name = chr(65 + ($number % 26)).$name;
            $number = intdiv($number, 26);
        }

        return $name;
    }

    private function safeSpreadsheetValue(mixed $value): string
    {
        $text = (string) $value;

        return preg_match('/^[=+\-@]/', ltrim($text)) ? "'".$text : $text;
    }
}
