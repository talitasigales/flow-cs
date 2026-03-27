

## Plano: Certificado com Layout Fixo (Template de Imagem)

### Abordagem

Em vez de desenhar o certificado inteiro via código jsPDF (formas, cores, linhas), usar uma **imagem de fundo fixa** (PNG de alta resolução) e apenas posicionar os textos dinâmicos por cima.

### O que você precisa fazer

1. **Exportar o layout do certificado como imagem PNG** (sem os textos dinâmicos — nome do aluno, programa, datas, código, nome do especialista). Isso pode ser feito no Canva, Figma, Illustrator ou Photoshop:
   - Resolução recomendada: 3508x2480px (A4 paisagem a 300dpi)
   - Deixar os espaços onde os textos dinâmicos entram **em branco** (sem texto, só o fundo/decoração)
   - Salvar como PNG

2. **Fazer upload dessa imagem** aqui no chat

### O que eu faço depois

- Substituo toda a lógica de desenho do `certificateUtils.ts` por:
  1. Carregar a imagem PNG como fundo (`doc.addImage` cobrindo toda a página)
  2. Posicionar apenas os textos dinâmicos nas coordenadas exatas (nome, programa, carga horária, datas, código, assinatura)
- Ajusto as coordenadas X/Y de cada campo para casar com o template

### Resultado

- Layout pixel-perfect, idêntico ao design original
- Apenas 6-8 campos de texto sobrepostos via jsPDF
- Qualquer mudança visual futura = trocar a imagem PNG, sem mexer em código

### Resumo de passos

| Passo | Responsável |
|---|---|
| Criar PNG do template sem textos dinâmicos | Você (designer/Canva) |
| Upload da imagem aqui | Você |
| Integrar como fundo + posicionar campos | Eu |

