/**
 * Шаңырақ — праздничная сцена на WebGL.
 *
 * Рисуется вручную написанным фрагментным шейдером, без three.js: для одного
 * момента библиотека стоила бы 887 КБ, тогда как здесь всё умещается
 * в несколько килобайт и грузится только по требованию.
 *
 * Сюжет выбран не случайно. Шаңырақ — венец юрты, изображённый на флаге
 * Казахстана: круг с расходящимися уықами. Радиальная симметрия ложится
 * в полярные координаты почти буквально, поэтому фигура выходит точной,
 * а не «похожей на что-то восточное».
 *
 * Модуль ничего не знает о React и сам себя убирает: вызвавший получает
 * функцию остановки.
 */

const VERT = `#version 300 es
in vec2 position;
void main() { gl_Position = vec4(position, 0.0, 1.0); }`;

const FRAG = `#version 300 es
precision highp float;

uniform vec2  uSize;      // размер холста в пикселях
uniform float uTime;      // секунды с начала
uniform float uProgress;  // 0..1 — раскрытие фигуры
uniform vec3  uGold;
uniform vec3  uDeep;
out vec4 outColor;

const float PI = 3.14159265;
const float SPOKES = 12.0;   // уық — столько же, сколько на флаге

// Мягкая граница шириной в один пиксель: без неё края «лесенкой».
float edge(float d, float w) { return smoothstep(w, -w, d); }

// Кольцо заданного радиуса и толщины.
float ring(float r, float radius, float thickness, float px) {
  return edge(abs(r - radius) - thickness, px);
}

// Плавный шум для лёгкой живости свечения.
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

void main() {
  vec2 uv = (gl_FragCoord.xy * 2.0 - uSize) / min(uSize.x, uSize.y);
  float px = 2.0 / min(uSize.x, uSize.y);   // один пиксель в этих координатах

  float r = length(uv);
  float a = atan(uv.y, uv.x);

  // Раскрытие: фигура вырастает из центра с замедлением.
  float p = clamp(uProgress, 0.0, 1.0);
  float ease = 1.0 - pow(1.0 - p, 3.0);
  // Держим фигуру компактной: на широкой карточке она иначе расползается
  // и перестаёт читаться как единый предмет.
  float scale = mix(0.30, 0.82, ease);
  r /= scale;

  float t = uTime;
  float glow = 0.0;
  float mask = 0.0;

  // --- уық: спицы от центра к венцу ---
  float spokeWave = cos(a * SPOKES + t * 0.25);
  // Уықи делаем весомее: тонкие волоски терялись рядом с венцом,
  // хотя в настоящем шаңырақе это несущие жерди.
  float spoke = smoothstep(0.975, 0.998, spokeWave);
  // Спицы живут между внутренним кругом и венцом.
  float spokeBand = smoothstep(0.12, 0.16, r) * smoothstep(0.62, 0.58, r);
  // Ближе к венцу жердь чуть толще — как в реальной конструкции.
  mask += spoke * spokeBand * mix(0.75, 1.0, smoothstep(0.15, 0.58, r));

  // --- венец: два кольца, между ними орнаментальная полоса ---
  mask += ring(r, 0.60, 0.012, px);
  mask += ring(r, 0.70, 0.006, px);

  // Орнамент в полосе: повторяющийся мотив, медленно вращается.
  float band = smoothstep(0.60, 0.62, r) * smoothstep(0.70, 0.68, r);
  float motif = abs(sin(a * SPOKES * 2.0 - t * 0.15));
  mask += band * smoothstep(0.55, 0.95, motif);

  // --- внутренний круг ---
  mask += ring(r, 0.13, 0.010, px);
  // Крестовина внутри круга — как перекрестье шаңырақа.
  float cross = max(smoothstep(0.992, 1.0, abs(cos(a * 2.0))),
                    smoothstep(0.992, 1.0, abs(sin(a * 2.0))));
  mask += cross * smoothstep(0.0, 0.02, r) * smoothstep(0.13, 0.11, r);

  // --- лучи наружу: короткая вспышка в момент появления ---
  float burst = exp(-pow((p - 0.35) * 4.5, 2.0));
  float rays = smoothstep(0.90, 1.0, cos(a * SPOKES * 2.0 + t * 0.6));
  glow += rays * burst * smoothstep(0.70, 1.15, r) * smoothstep(1.5, 0.9, r) * 0.9;

  // --- общее свечение ---
  glow += exp(-r * 4.5) * 0.30 * ease;                 // тёплый центр
  glow += mask * 0.85;
  glow += exp(-abs(r - 0.65) * 26.0) * 0.22 * ease;    // ореол вокруг венца

  // Блик, один раз проходящий по фигуре.
  float sweep = exp(-pow((a / PI * 0.5 + 0.5 - fract(t * 0.18)) * 6.0, 2.0));
  glow += mask * sweep * 0.7;

  // Цвет: от глубокого к золотому по силе свечения.
  vec3 color = mix(uDeep, uGold, clamp(glow, 0.0, 1.0));
  color += uGold * pow(clamp(glow, 0.0, 1.0), 3.0) * 0.6;   // подсветка ярких мест

  // Прозрачность к краям, чтобы сцена вписывалась в карточку.
  float vignette = smoothstep(1.05, 0.45, r);
  float alpha = clamp(glow, 0.0, 1.0) * vignette * ease;

  // Дизеринг: без него на плавных переходах видны полосы.
  alpha += (hash(gl_FragCoord.xy) - 0.5) * 0.012;

  outColor = vec4(color * alpha, alpha);   // предумноженная альфа
}`;

function compile(gl: WebGL2RenderingContext, type: number, src: string): WebGLShader | null {
  const sh = gl.createShader(type);
  if (!sh) return null;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    gl.deleteShader(sh);
    return null;
  }
  return sh;
}

export interface SceneOptions {
  /** Цвета берём из темы, чтобы сцена не выпадала из оформления. */
  gold: [number, number, number];
  deep: [number, number, number];
  /** Сколько секунд идёт раскрытие. */
  duration?: number;
}

/**
 * Запускает сцену на переданном холсте.
 * Возвращает функцию остановки — она освобождает все ресурсы WebGL.
 */
export function mountShanyrak(canvas: HTMLCanvasElement, opts: SceneOptions): () => void {
  const gl = canvas.getContext('webgl2', {
    alpha: true,
    antialias: false,          // сглаживаем в шейдере, это дешевле
    premultipliedAlpha: true,
    powerPreference: 'low-power',
  });
  if (!gl) return () => {};

  const vs = compile(gl, gl.VERTEX_SHADER, VERT);
  const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
  const program = gl.createProgram();
  if (!vs || !fs || !program) return () => {};

  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return () => {};

  gl.useProgram(program);

  // Один треугольник на весь экран — дешевле прямоугольника из двух.
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(program, 'position');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const uSize = gl.getUniformLocation(program, 'uSize');
  const uTime = gl.getUniformLocation(program, 'uTime');
  const uProgress = gl.getUniformLocation(program, 'uProgress');
  gl.uniform3fv(gl.getUniformLocation(program, 'uGold'), opts.gold);
  gl.uniform3fv(gl.getUniformLocation(program, 'uDeep'), opts.deep);

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);   // под предумноженную альфу

  const duration = opts.duration ?? 1.6;
  const start = performance.now();
  let frame = 0;
  let stopped = false;

  const resize = () => {
    // Плотность пикселей ограничиваем: на телефонах с dpr 3 выигрыш
    // незаметен, а нагрузка растёт вдевятеро.
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
    const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
    }
    gl.uniform2f(uSize, canvas.width, canvas.height);
  };

  const draw = (now: number) => {
    if (stopped) return;
    const elapsed = (now - start) / 1000;
    resize();
    gl.uniform1f(uTime, elapsed);
    gl.uniform1f(uProgress, Math.min(1, elapsed / duration));
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    frame = requestAnimationFrame(draw);
  };
  frame = requestAnimationFrame(draw);

  return () => {
    stopped = true;
    cancelAnimationFrame(frame);
    gl.deleteBuffer(buffer);
    gl.deleteProgram(program);
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    // Освобождаем контекст сразу: браузер держит их ограниченное число.
    gl.getExtension('WEBGL_lose_context')?.loseContext();
  };
}
