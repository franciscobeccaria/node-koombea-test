import app from './app.mjs';
import ENV from './utils/env.mjs';

const PORT = ENV.PORT;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Environment: ${ENV.NODE_ENV}`);
});
