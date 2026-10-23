const { z } = require("zod");
const { ObjectId } = require("mongodb");
function falhar(status, mensagem) {
  const erro = new Error(mensagem);
  erro.status = status;
  throw erro;
}
function id(valor) {
  if (typeof valor !== "string" || !/^[a-f\d]{24}$/i.test(valor))
    falhar(400, "Identificador inválido.");
  return new ObjectId(valor);
}
const email = z.string().trim().toLowerCase().email().max(254);
const senha = z
  .string()
  .min(12, "A senha deve ter pelo menos 12 caracteres.")
  .max(128);
function cpfValido(valor) {
  if (!/^\d{11}$/.test(valor) || /^(\d)\1+$/.test(valor)) return false;
  for (let tamanho = 9; tamanho <= 10; tamanho++) {
    let soma = 0;
    for (let i = 0; i < tamanho; i++)
      soma += Number(valor[i]) * (tamanho + 1 - i);
    const resto = (soma * 10) % 11;
    if ((resto === 10 ? 0 : resto) !== Number(valor[tamanho])) return false;
  }
  return true;
}
const cadastro = z.object({
  nome: z.string().trim().min(2).max(120),
  email,
  senha,
  cpf: z
    .string()
    .transform((v) => v.replace(/\D/g, ""))
    .refine((v) => v === "" || cpfValido(v), "CPF inválido.")
    .optional(),
  perfil: z.literal("paciente").optional(),
});
const data = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((v) => {
    const d = new Date(v + "T00:00:00Z");
    return !Number.isNaN(+d) && d.toISOString().slice(0, 10) === v;
  }, "Data inválida.");
const vacina = z
  .object({
    vacina: z.string().trim().min(2).max(160),
    dose: z.string().trim().min(1).max(80),
    aplicadaEm: data,
    proximaEm: z.union([data, z.literal("")]).default(""),
    observacao: z.string().trim().max(2000).default(""),
    permitirEdicao: z.boolean().optional(),
  })
  .refine(
    (v) => !v.proximaEm || v.proximaEm >= v.aplicadaEm,
    "A próxima data não pode ser anterior à aplicação.",
  );
function publico(u) {
  return {
    id: u._id.toString(),
    nome: u.nome,
    email: u.email,
    cpf: u.cpf || "",
    perfil: u.perfil,
  };
}
module.exports = { z, email, senha, cadastro, vacina, id, falhar, publico };
