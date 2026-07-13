export function errorHandler(err, _req, res, _next) {
  const status = err.status ?? 500;
  if (status >= 500) console.error(err);
  res.status(status).json({
    erro: status >= 500 ? 'Erro interno do servidor' : err.message,
  });
}
