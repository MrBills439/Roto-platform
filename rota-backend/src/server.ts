import { app } from "./app";
import { env } from "./env";
import { assignmentsService } from "./modules/assignments/assignments.service";

app.listen(env.PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Server listening on port ${env.PORT}`);
});

setInterval(() => {
  assignmentsService.expirePending().catch(() => undefined);
}, 60 * 1000);
