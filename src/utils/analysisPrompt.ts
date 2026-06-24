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
