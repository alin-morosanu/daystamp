import moment from 'moment';

// Never depend on the machine's locale.
moment.locale('en');

// Services use window.setTimeout for popout safety; Node has no window.
const g = globalThis as unknown as { window?: unknown };
g.window ??= globalThis;
