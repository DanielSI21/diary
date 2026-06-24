# Prompt para convertir tu historial del navegador en logs

Copia el bloque de abajo en ChatGPT o Claude. **Antes de enviarlo**:

1. Reemplaza `[PEGA AQUÍ TUS ETIQUETAS]` por la lista de etiquetas que tienes en
   **Ajustes** de la app, separadas por comas (ej. `Trabajo, Ocio, Ejercicio, Estudio`).
   Deben escribirse **igual** que en la app para que se asignen solas al importar;
   si una no coincide, el log se importa sin etiqueta (puedes asignarla a mano).
2. Pega tu historial del navegador al final, donde dice `[PEGA AQUÍ TU HISTORIAL]`.

El resultado es un JSON que puedes copiar y pegar (o guardar como `.json`) en la
sección **«Importar logs»** al fondo de la pantalla del día.

---

```
Convierte mi historial del navegador en un registro de actividad ("logs").
No tiene que ser perfectamente preciso, pero sí fiel a lo que hice y a las horas.

REGLAS DE AGRUPACIÓN (muy importante):
- UNIFICA actividades relacionadas en un solo log con su hora inicial y final.
  No quiero 5 logs seguidos de ocio (uno de Instagram, otro de YouTube, otro de
  una tienda...). Si en un rato navegué entre varias páginas del mismo tipo,
  resúmelo en UN solo log. Ej: "Ocio: reviso Instagram, YouTube y tiendas de tenis".
- Usa la hora más temprana como inicio y la más tardía como final de cada bloque.
- Describe en una frase clara qué hice en ese bloque (en primera persona o neutral).
- Asígnale UNA etiqueta de esta lista (escríbela EXACTAMENTE igual):
  [Productividad,DeclaraBCS,ITPBCS,Gym,Dieta,Ocio,Finanzas,Social,Otros]
  Si un bloque no encaja en ninguna, usa la más cercana o deja "tag" como "".
- Acalaraciones: ITPBCS es el tag indicado para todas las actividades del Instituto de Transparencia para el Pueblo, el lugar donde trabajo, todo lo que tenga que ver con transparencia, plataforma digital de transparencia, etc, todo va relacionado a ese tag.
- Acalaraciones: DeclaraBCS es el tag indicado para todas las actividaes relacionadas a cualquier sistema de declaraciones (testdeclara, plataforma digital nacional, plataforma digital estatal, proyecto de desarrollo del sistema de declaraciones, etc)


FORMATO DE SALIDA (obligatorio):
- Responde ÚNICAMENTE con un arreglo JSON válido. Nada de texto antes o después.
- Cada elemento debe tener exactamente estas claves:
  - "start": hora inicial en formato 24h "HH:MM"
  - "end": hora final en formato 24h "HH:MM" (si no aplica, usa "")
  - "description": qué hice, en una frase
  - "tag": una etiqueta de la lista, o ""
- Ordena los logs cronológicamente.

EJEMPLO de salida:
[
  { "start": "20:10", "end": "20:50", "description": "Reviso documentos del proyecto SEIPA (encuestas, censo) y subo cambios a GitLab.", "tag": "Trabajo" },
  { "start": "20:50", "end": "22:10", "description": "Ocio: investigo y comparo tenis para correr (Nike, New Balance) entre varias tiendas, reviso Instagram y WhatsApp.", "tag": "Ocio" }
]

MI HISTORIAL:
[PEGA AQUÍ TU HISTORIAL]
```
