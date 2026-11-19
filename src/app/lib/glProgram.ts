/**
 * Waits for a WebGL program to finish compiling without blocking.
 *
 * Asking for a shader's status straight after compiling it forces the GPU to finish the job
 * there and then, and a big fragment shader can take most of a second — freezing every other
 * canvas on the page meanwhile (the loading screen's butterfly, the hero tunnel...). With
 * KHR_parallel_shader_compile the GPU compiles in the background and we simply check back
 * until it's done. Without the extension it falls back to the old, immediate behaviour.
 *
 * Returns a function that cancels the wait.
 */
export function whenProgramReady(gl: WebGLRenderingContext | WebGL2RenderingContext, program: WebGLProgram, ready: () => void) {
  const ext = gl.getExtension('KHR_parallel_shader_compile') as { COMPLETION_STATUS_KHR: number } | null;
  if (!ext) {
    ready();
    return () => {};
  }
  let timer = 0;
  let cancelled = false;
  const poll = () => {
    if (cancelled || gl.isContextLost()) return;
    if (gl.getProgramParameter(program, ext.COMPLETION_STATUS_KHR)) ready();
    else timer = window.setTimeout(poll, 32);
  };
  timer = window.setTimeout(poll, 0);
  return () => {
    cancelled = true;
    window.clearTimeout(timer);
  };
}
