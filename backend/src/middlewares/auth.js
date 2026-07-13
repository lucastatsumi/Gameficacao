import { db, supabaseAuth } from '../config/supabase.js';
import { HttpError } from '../utils/httpError.js';

// Valida o JWT emitido pelo Supabase Auth e anexa o perfil em req.usuario
export async function autenticar(req, _res, next) {
  try {
    const header = req.headers.authorization ?? '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) throw new HttpError(401, 'Token de autenticação ausente');

    const { data, error } = await supabaseAuth.auth.getUser(token);
    if (error || !data?.user) throw new HttpError(401, 'Token inválido ou expirado');

    const { data: perfil, error: erroPerfil } = await db
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .maybeSingle();
    if (erroPerfil) throw erroPerfil;
    if (!perfil) throw new HttpError(401, 'Perfil não encontrado para este usuário');

    req.usuario = perfil;
    next();
  } catch (err) {
    next(err);
  }
}

export function exigirProfessor(req, _res, next) {
  if (req.usuario?.role !== 'professor') {
    return next(new HttpError(403, 'Acesso restrito a professores'));
  }
  next();
}
