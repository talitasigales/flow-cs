

## Plano: Certificado com Template de Imagem Fixa

### Abordagem

Usar a imagem PNG enviada como fundo fixo do certificado. Remover toda a lógica de desenho (retângulos, linhas, dots, gradientes) e substituir por:

1. Carregar o PNG como background cobrindo toda a página A4 landscape
2. Sobrepor apenas os campos dinâmicos nas posições corretas

### Campos dinâmicos a posicionar sobre o template

Com base no layout da imagem (que já contém: fundo gradiente laranja→azul, "CERTIFICADO DE CONCLUSÃO", badge "WORKSHOP", arcos decorativos, logo Grou):

| Campo | Conteúdo | Posição aproximada (mm) |
|---|---|---|
| Nome do programa | `data.programName` (grande, branco, Poppins Bold) | x:20, y:95 — título grande |
| Descrição | Texto com nome do programa e carga horária (Montserrat) | x:20, y:135 |
| Nome do aluno | `data.studentName` sob linha "ALUNO" | x:65, y:175 |
| Assinatura | Imagem + nome do especialista | x:155, y:170 |
| Código | `data.certificateCode` (discreto, canto inferior) | x:148, y:205 |

### Arquivos

| Arquivo | Ação |
|---|---|
| `public/certificate-template.png` | Copiar a imagem enviada |
| `src/utils/certificateUtils.ts` | Reescrever: remover toda lógica de desenho, usar `doc.addImage` para o template + posicionar textos dinâmicos |

### Detalhes técnicos

- O template PNG já contém: background, "CERTIFICADO DE CONCLUSÃO", badge "WORKSHOP", arcos decorativos, logo Grou, linhas de assinatura e labels "ALUNO"/"ESPECIALISTA"
- O código só precisa inserir: nome do programa, parágrafo descritivo, nome do aluno, assinatura do especialista, nome do especialista e código de verificação
- Fontes Poppins e Montserrat já estão disponíveis em `public/fonts/`
- As coordenadas serão ajustadas com base na proporção A4 landscape (297×210mm)

