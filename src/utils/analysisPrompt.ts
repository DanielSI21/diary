/**
 * Prompt fijo para pedir a ChatGPT/Claude/Codex un análisis profundo del día.
 * Se copia junto con el resumen del día (ver `buildAnalysisClipboard`).
 */
export const ANALYSIS_PROMPT = `Quiero que analices mi día a partir de los logs, notas, pensamientos, metas y registros que te voy a pegar.

No quiero un simple resumen cronológico. Quiero un análisis útil para mejorar mi productividad, concentración, claridad mental y toma de decisiones.

Instrucciones de análisis:

1. Primero haz un resumen ejecutivo del día en 5–8 líneas.
2. Identifica los principales bloques de actividad del día: trabajo, estudio, salud, ocio, redes/social, administración, descanso, traslados, familia, etc.
3. Estima, si es posible, cómo se distribuyó mi tiempo por categorías. No tiene que ser perfecto; puede ser aproximado.
4. Detecta patrones de productividad:

   * momentos de buen foco,
   * momentos de dispersión,
   * momentos de procrastinación,
   * momentos de hiperfoco,
   * factores que ayudaron a concentrarme,
   * factores que me sacaron del foco.
5. Analiza mi atención:

   * qué estímulos me distrajeron,
   * qué impulsos repetí,
   * cuándo abrí redes o WhatsApp de forma automática,
   * cuándo logré volver conscientemente a la tarea.
6. Detecta loops abiertos:

   * tareas pendientes,
   * decisiones sin cerrar,
   * conversaciones pendientes,
   * preocupaciones recurrentes,
   * ideas que debo estacionar para después.
7. Analiza cómo mi estado emocional o mental pudo influir en mi productividad, pero sin centrarte en el drama personal. Solo menciona lo personal cuando tenga relación directa con mi atención, energía, motivación o toma de decisiones.
8. Identifica qué cosas sí funcionaron hoy.
9. Identifica qué cosas me drenaron energía o me hicieron perder claridad.
10. Dame 3–5 insights concretos sobre mi día.
11. Dame 3 acciones prácticas para mañana:

    * una acción para mejorar el foco,
    * una acción para cerrar o reducir un loop abierto,
    * una acción para cuidar mi energía.
12. Termina con una versión breve tipo:

    * "Lo más importante del día fue..."
    * "El principal riesgo fue..."
    * "La mejora clave para mañana es..."

Formato de salida deseado:

# Análisis del día

## 1. Resumen ejecutivo

...

## 2. Distribución aproximada del tiempo

...

## 3. Patrones de foco y distracción

...

## 4. Loops abiertos detectados

...

## 5. Estado mental, energía y carga emocional

...

## 6. Qué funcionó hoy

...

## 7. Qué me drenó o me dispersó

...

## 8. Insights clave

...

## 9. Acciones recomendadas para mañana

...

## 10. Cierre breve

...

Importante:

* Sé honesto, directo y útil.
* No me trates como paciente ni hagas diagnósticos clínicos.
* No exageres conclusiones psicológicas.
* Si algo no se puede inferir con seguridad, dilo como hipótesis.
* Prioriza patrones, relaciones y sistemas, no detalles aislados.
* El objetivo es ayudarme a entender cómo estoy usando mi tiempo y cómo puedo mejorar.`;

/**
 * Prompt para un análisis GLOBAL de los últimos 7 días. Recibe el resumen de
 * cada día (logs, notas, objetivos) y, cuando existen, análisis previos —tanto
 * del día completo como de logs/notas individuales—. El objetivo es ver
 * tendencias y patrones a lo largo de la semana, no analizar cada día aislado.
 */
export const WEEKLY_ANALYSIS_PROMPT = `Quiero que analices mi ÚLTIMA SEMANA (los últimos 7 días) a partir de los resúmenes diarios, logs, notas, pensamientos, metas y registros que te voy a pegar.

No quiero un resumen día por día ni una repetición cronológica. Quiero un análisis GLOBAL y comparativo de la semana, útil para mejorar mi productividad, concentración, claridad mental y toma de decisiones a mediano plazo.

IMPORTANTE sobre el material:
- Recibirás varios días seguidos, cada uno con su resumen (tiempo por etiqueta, objetivos, logs y notas).
- Algunos días o algunos logs/notas pueden traer un ANÁLISIS PREVIO ya generado (claramente marcado). Úsalo como contexto e insumo, NO lo confundas con un registro original ni lo repitas tal cual; intégralo en tu visión semanal.

Instrucciones de análisis (a nivel SEMANAL):

1. Resumen ejecutivo de la semana en 6–10 líneas.
2. Distribución del tiempo de la semana por categorías/etiquetas (aproximada) y cómo varió entre días.
3. Tendencias y patrones que se repiten a lo largo de la semana:

   * días/horas de mejor foco vs. de mayor dispersión,
   * patrones de procrastinación o hiperfoco recurrentes,
   * disparadores constantes de distracción (redes, WhatsApp, etc.),
   * hábitos que se sostuvieron y hábitos que se cayeron.
4. Evolución: ¿la semana fue de menos a más, de más a menos, o irregular? ¿Hubo días ancla y días perdidos?
5. Loops abiertos que arrastré durante la semana: pendientes recurrentes, decisiones sin cerrar, preocupaciones repetidas.
6. Cumplimiento de objetivos a lo largo de la semana: qué tipo de objetivos cumplí y cuáles postergué sistemáticamente.
7. Energía y estado mental a lo largo de la semana (solo en relación con foco, motivación y decisiones; sin diagnósticos clínicos).
8. Qué funcionó de forma consistente y qué me drenó de forma recurrente.
9. 4–6 insights clave de la semana.
10. Plan para la próxima semana: 3–5 acciones concretas (foco, cierre de loops, energía, sistema/rutina).
11. Cierre breve:

    * "Lo más importante de la semana fue..."
    * "El principal patrón a corregir es..."
    * "La apuesta clave para la próxima semana es..."

Formato de salida deseado:

# Análisis semanal

## 1. Resumen ejecutivo de la semana

...

## 2. Distribución del tiempo y variación entre días

...

## 3. Tendencias y patrones recurrentes

...

## 4. Evolución de la semana

...

## 5. Loops abiertos arrastrados

...

## 6. Objetivos: cumplimiento y postergación

...

## 7. Energía y estado mental

...

## 8. Qué funcionó y qué me drenó

...

## 9. Insights clave de la semana

...

## 10. Plan para la próxima semana

...

## 11. Cierre breve

...

Importante:

* Sé honesto, directo y útil.
* Prioriza patrones, relaciones y sistemas a lo largo de los días, no detalles aislados.
* Si algo no se puede inferir con seguridad, dilo como hipótesis.
* No me trates como paciente ni hagas diagnósticos clínicos.
* El objetivo es entender cómo usé mi semana y cómo mejorar la próxima.`;
