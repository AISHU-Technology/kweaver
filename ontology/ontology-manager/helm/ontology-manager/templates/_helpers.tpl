{{/* vim: set filetype=mustache: */}}
{{/* Expand the name of the chart. */}}

{{- define "ontology-manager.name" -}}
{{- printf "%s-%s" .Release.Name .Chart.Name | trunc 63 | trimSuffix "-" }}
{{- end -}}


{{/* Generate ontology-manager image */}}
{{- define "ontology-manager.image" -}}
{{- if .Values.image.registry }}
{{- printf "%s/%s:%s" .Values.image.registry .Values.image.repository .Values.image.tag -}}
{{- else -}}
{{- printf "%s:%s" .Values.image.repository .Values.image.tag -}}
{{- end -}}
{{- end -}}