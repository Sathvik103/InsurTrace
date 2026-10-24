// Lets Node's test scripts import app modules: maps "@/x" to src/x and adds ".ts".
import { register } from 'node:module';
register('./alias-hooks.mjs', import.meta.url);
