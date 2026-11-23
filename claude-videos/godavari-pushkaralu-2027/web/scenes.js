import { SCENES_A } from './scenes_a.js';
let B = {}, C2 = {};
try { B = (await import('./scenes_b.js')).SCENES_B; } catch (e) { if (!String(e).includes('Failed to fetch')) throw e; }
try { C2 = (await import('./scenes_c.js')).SCENES_C; } catch (e) { if (!String(e).includes('Failed to fetch')) throw e; }
export const SCENES = { ...SCENES_A, ...B, ...C2 };
