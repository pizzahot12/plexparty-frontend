# Instrucciones para Kimi: Optimización de Responsive Design (Mobile) en PlexParty

¡Hola Kimi! 
Tu objetivo en esta sesión es rediseñar y solucionar los problemas de maquetación y experiencia de usuario (UX/UI) en la vista móvil del reproductor de video de **PlexParty** (`WatchPage`).

## Contexto del Problema

Actualmente, el diseño de la página donde los usuarios ven las películas (`src/pages/WatchPage.tsx`), chatean (`src/components/Watch/ChatPanel.tsx`) y ven los controles (`src/components/Watch/VideoPlayer.tsx`) presenta bastantes inconsistencias cuando se utiliza en un **teléfono móvil**:

1. **El Chat ocupa demasiado espacio:** Cuando se abre el chat en móvil, la pantalla se reduce torpemente. La lógica actual fuerza la altura del video (`h-[20vh]` o `h-[60vh]`) y el panel del chat sube desde abajo ocupando casi todo.
2. **El Video desaparece al escribir:** Al tocar el input del chat para enviar un mensaje, el teclado virtual del móvil empuja la interfaz hacia arriba, expulsando al reproductor de video fuera del área visible. El usuario *necesita* poder ver la película mientras envía mensajes.
3. **Botones poco consistentes:** Algunos botones del reproductor o del header no reaccionan bien a los toques táctiles o no tienen un buen tamaño ("touch target").
4. **Falta de Adaptación:** El chat y la UI no respetan correctamente el *"aspect ratio"* (tamaño real) del video, provocando que se vea aplastado o dejando franjas inútiles.

## Objetivo Principal

Hacer que la experiencia en dispositivos móviles sea **completamente fluida ("Responsive")** y profesional, al nivel de aplicaciones como Netflix, Twitch o YouTube.

### Requisitos Funcionales que debes implementar:

1. **Video Fijo Arriba (Sticky/Fixed):** 
   En la vista móvil, el reproductor de video DEBE mantenerse siempre visible en la parte superior (respetando su aspect ratio de 16:9 de forma natural). Bajo ninguna circunstancia el teclado virtual del dispositivo móvil debe ocultar el video. 
   
2. **Chat Inteligente:**
   En lugar de forzar alturas fijas molestas (`h-[20vh]`), haz que el contenedor principal sea una columna flexible (flex-col). El reproductor arriba toma su tamaño necesario, y el área sobrante hacia abajo debe pertenecer al Chat, con un scroll interno para los mensajes. De esta manera, al abrir el teclado, el chat se reduce pero el video se mantiene arriba.
   
3. **Revisar Botones y Controles (`VideoPlayer.tsx`):**
   - Asegúrate de que los botones del reproductor tengan buen padding en móviles (`p-3` o tamaños adecuados).
   - Verifica que la UI de controles se adapte bien cuando la pantalla sea muy pequeña.

4. **Archivos Clave a Modificar:**
   - **`src/pages/WatchPage.tsx`**: (Principal culpable) Aquí está la maquetación. Debes reescribir la estructura Flex/Grid para celular. Elimina esa lógica de `h-[20vh]` o `h-[60vh]`. Considera usar tamaños responsivos reales como `aspect-video`.
   - **`src/components/Watch/ChatPanel.tsx`**: Para asegurarte de que el contenedor de mensajes tenga `overflow-y-auto` correcto sin romper la pantalla completa del padre.
   - **`src/components/Watch/VideoPlayer.tsx`**: Modificar estilos de controles si es necesario para adaptarlos a táctil.
   - Considerar arreglar el **`index.css`** si requieres algún utilitario extra o `env(safe-area-inset-bottom)`.

## Ejemplo de lo esperado en Móvil (`WatchPage`):
```tsx
<div className="flex flex-col h-[100dvh] bg-black">
   {/* Header condicional o integrado al video */}
   <div className="w-full aspect-video flex-shrink-0 bg-black sticky top-0 z-50">
      <VideoPlayer />
   </div>
   <div className="flex-1 overflow-hidden relative">
      {/* Contenido del panel (Chat o Participantes) que ocupa el resto */}
      <ChatPanel /> // con flex-1 y overflow-y auto en los mensajes
   </div>
</div>
```

**Por favor Kimi, analiza `WatchPage.tsx` y reconstruye la UI móvil para que sea perfecta.** Usa Tailwind CSS y siéntete libre de reordenar el layout para conseguir la mejor UX. No rompas la versión de Desktop (`lg:flex`), tu enfoque primario debe ser el breakpoint móvil (`max-w-lg`).
