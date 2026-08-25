// Registro de envios (e-mail / WhatsApp) por turma e por aluno.
export type DeliveryChannel = 'email' | 'whatsapp';
export type DeliveryStatus = 'processing' | 'sent' | 'failed';

export interface DeliveryLogInput {
  class_id?: string | null;
  program_id?: string | null;
  user_id?: string | null;
  recipient_name?: string | null;
  recipient_email?: string | null;
  recipient_phone?: string | null;
  channel: DeliveryChannel;
  message_type: string;
  session_date?: string | null;
}

/** Cria o registro em "processing" e devolve o id (ou null se falhar). */
export async function startDeliveryLog(supabase: any, input: DeliveryLogInput): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('message_delivery_logs')
      .insert({ ...input, status: 'processing' })
      .select('id')
      .maybeSingle();
    if (error) {
      console.error('delivery-log insert error', error.message);
      return null;
    }
    return data?.id ?? null;
  } catch (e) {
    console.error('delivery-log insert exception', e);
    return null;
  }
}

/** Finaliza o registro como enviado ou falhou. */
export async function finishDeliveryLog(
  supabase: any,
  id: string | null,
  ok: boolean,
  details?: unknown,
): Promise<void> {
  if (!id) return;
  try {
    await supabase
      .from('message_delivery_logs')
      .update({
        status: ok ? 'sent' : 'failed',
        sent_at: ok ? new Date().toISOString() : null,
        error_message: ok ? null : typeof details === 'string' ? details : JSON.stringify(details ?? {}).slice(0, 2000),
        provider_response: details && typeof details === 'object' ? details : null,
      })
      .eq('id', id);
  } catch (e) {
    console.error('delivery-log update exception', e);
  }
}
