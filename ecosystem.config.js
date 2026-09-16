// Configuración de PM2 para usar los 2 núcleos de la VM. Antes corría en
// modo "fork" (una sola instancia, un solo núcleo). El estado que antes
// vivía en memoria de un único proceso (límite de intentos de login) ahora
// vive en la base de datos precisamente porque acá hay más de un worker.
module.exports = {
  apps: [
    {
      name: "sitecorpac",
      script: "node_modules/next/dist/bin/next",
      args: "start",
      cwd: __dirname,
      instances: 2,
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
