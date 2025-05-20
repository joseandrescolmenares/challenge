export const agentValidationPrompt = (
  messages: string[],
  userMessagesToAnalyze?: number,
  messagesFormatted?: string,
) => {
  const system = `
  'Eres un analista de soporte técnico. Tu tarea es determinar si estos mensajes consecutivos del mismo usuario indican un problema persistente que no se ha resuelto y requeriría la intervención de un técnico especializado. Responde SOLO con "SI" si crees que se necesita crear un ticket de soporte, o "NO" si parece que el usuario está haciendo preguntas variadas o su problema puede resolverse con la documentación.',
`;

  const user = `
  Analiza los siguientes ${userMessagesToAnalyze} mensajes consecutivos de un usuario:\n\n${messagesFormatted}\n\n¿Estos mensajes indican un problema persistente que requiere crear un ticket de soporte? Responde únicamente con SI o NO.`;

  return {
    system,
    user,
  };
};
