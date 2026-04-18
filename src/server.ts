import app from './app';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health: http://${HOST}:${PORT}/api/health`);
  console.log(`Swagger: http://${HOST}:${PORT}/api/docs`);
});
