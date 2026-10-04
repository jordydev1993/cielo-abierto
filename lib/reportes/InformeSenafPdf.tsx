// Documento PDF del informe SENAF aprobado (prompts/027). Se renderiza en el servidor.
import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import { nombrePeriodo } from '@/lib/reportes/senaf'
import type { ReporteSenaf } from '@/types/database.types'

const styles = StyleSheet.create({
  page: { paddingVertical: 48, paddingHorizontal: 56, fontSize: 11, fontFamily: 'Helvetica', lineHeight: 1.45, color: '#1f2933' },
  institucion: { fontSize: 9, textTransform: 'uppercase', letterSpacing: 1, color: '#52606d' },
  titulo: { fontSize: 18, fontFamily: 'Helvetica-Bold', marginTop: 6 },
  subtitulo: { fontSize: 11, color: '#52606d', marginTop: 6, marginBottom: 24 },
  seccion: { marginBottom: 14 },
  seccionTitulo: { fontSize: 12, fontFamily: 'Helvetica-Bold', marginBottom: 4 },
  pie: { marginTop: 24, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#cbd2d9', fontSize: 9, color: '#52606d' },
  numero: { position: 'absolute', bottom: 24, right: 56, fontSize: 9, color: '#9aa5b1' },
})

export function InformeSenafPdf({ reporte, aprobadoPor }: { reporte: ReporteSenaf; aprobadoPor: string }) {
  const periodo = nombrePeriodo(reporte.periodo_mes, reporte.periodo_anio)
  const fechaAprobacion = reporte.aprobado_at
    ? new Date(reporte.aprobado_at).toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Cordoba' })
    : ''

  return (
    <Document title={`Informe SENAF - ${periodo}`} author="Argüello Infancias">
      <Page size="A4" style={styles.page}>
        <Text style={styles.institucion}>Residencia Argüello Infancias · Córdoba</Text>
        <Text style={styles.titulo}>Informe institucional mensual</Text>
        <Text style={styles.subtitulo}>
          Período: {periodo} · Versión {reporte.version}
        </Text>

        {reporte.texto_final.map((s) => (
          <View key={s.clave} style={styles.seccion} wrap={false}>
            <Text style={styles.seccionTitulo}>{s.titulo}</Text>
            <Text>{s.texto}</Text>
          </View>
        ))}

        {reporte.observaciones_direccion ? (
          <View style={styles.seccion}>
            <Text style={styles.seccionTitulo}>Observaciones de Dirección</Text>
            <Text>{reporte.observaciones_direccion}</Text>
          </View>
        ) : null}

        <View style={styles.pie}>
          <Text>
            Aprobado por {aprobadoPor} el {fechaAprobacion}.
          </Text>
          <Text>
            {reporte.origen_borrador === 'ia'
              ? 'El borrador fue redactado con asistencia de inteligencia artificial a partir de datos agregados, y revisado por quien lo aprobó.'
              : 'El borrador fue generado automáticamente a partir de los datos del sistema, y revisado por quien lo aprobó.'}
          </Text>
        </View>

        <Text style={styles.numero} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} fixed />
      </Page>
    </Document>
  )
}
