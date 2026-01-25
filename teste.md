DEBUG – POSSÍVEIS MOTIVOS PARA A REFLEXÃO NÃO APARECER (WebGL)

Este documento lista os principais motivos pelos quais um efeito de
reflexão planar usando framebuffer pode não aparecer, mesmo sem erros
de compilação ou execução.

==================================================
1. FRAMEBUFFER DE REFLEXÃO ESTÁ VAZIO (PRETO)
--------------------------------------------------
- A cena refletida não está sendo renderizada corretamente.
- Pode ser causado por:
  • câmera refletida fora da cena
  • clipping plane errado
  • depth buffer não limpo
- Teste: renderizar a textura do FBO diretamente em um objeto comum.
  Se aparecer preto, o problema NÃO é o shader do vidro.

==================================================
2. CÂMERA REFLETIDA APONTA PARA O LADO ERRADO
--------------------------------------------------
- A posição da câmera foi espelhada, mas o vetor de direção (forward) não.
- Resultado: a câmera “olha para fora” da cena refletida.
- Sintoma: framebuffer válido, mas sem conteúdo visível.

==================================================
3. NORMAL DO PLANO DE VIDRO ESTÁ INVERTIDA
--------------------------------------------------
- Normal do plano = (0, 1, 0)
- Se a câmera estiver abaixo do plano:
  dot(viewDir, normal) < 0
- O Fresnel fica praticamente zero e a reflexão nunca aparece.
- Teste: usar abs(dot(viewDir, normal)) temporariamente.

==================================================
4. FACE CULLING DESCARTANDO O PLANO
--------------------------------------------------
- Se gl.CULL_FACE estiver ativo e o winding order estiver errado,
  o plano pode não ser desenhado.
- Teste: desativar face culling para verificar.

==================================================
5. MATRIZ uReflectionViewProjectionMatrix INCORRETA
--------------------------------------------------
- Erro comum de ordem de multiplicação:
  projection * view (correto)
  view * projection (errado)
- Pode fazer toda a projeção cair fora do clip space.
- Teste: passar apenas a projectionMatrix temporariamente.

==================================================
6. COORDENADAS DE REFLEXÃO FORA DO INTERVALO [0,1]
--------------------------------------------------
- Se as UVs calculadas estiverem sempre fora do intervalo,
  a textura nunca será amostrada.
- Sintoma: reflexão invisível sem erros.
- Teste: remover clamp ou discard temporariamente.

==================================================
7. CLIPPING PLANE MAL DEFINIDO OU SEM BIAS
--------------------------------------------------
- Plano exatamente em y = 0 com clipping [0, 1, 0, 0]
  pode descartar objetos coplanares.
- Solução: aplicar pequeno bias (ex: -0.01).

==================================================
8. TEXTURA DO FRAMEBUFFER NÃO ESTÁ NO SLOT CORRETO
--------------------------------------------------
- uReflectionTexture pode estar lendo TEXTURE0 por engano.
- Certificar que:
  • gl.activeTexture(gl.TEXTURE1)
  • gl.uniform1i(uReflectionTexture, 1)

==================================================
9. DEPTH MASK BLOQUEANDO A REFLEXÃO
--------------------------------------------------
- Se gl.depthMask(false) não for usado ao renderizar o vidro,
  o depth buffer pode ocultar a reflexão.
- depthMask(false) deve ser usado SOMENTE no vidro.

==================================================
10. ORDEM DE RENDERIZAÇÃO INCORRETA
--------------------------------------------------
- O vidro deve ser renderizado depois da cena principal.
- Ordem errada:
  vidro → objetos
- Ordem correta:
  objetos → vidro

==================================================
11. RESOLUÇÃO DO FRAMEBUFFER MUITO BAIXA
--------------------------------------------------
- Framebuffer pequeno pode causar reflexo imperceptível.
- Recomendado: 1024x1024 ou maior.

==================================================
12. FILTRAGEM DA TEXTURA DO FBO
--------------------------------------------------
- Uso de NEAREST pode deixar o reflexo invisível ou muito ruim.
- Preferir LINEAR.

==================================================
13. PROBLEMAS DE PRECISÃO (principalmente mobile)
--------------------------------------------------
- highp pode falhar em alguns dispositivos.
- Teste com mediump no fragment shader.

==================================================
14. CORES MUITO ESCURAS (GAMMA / ILUMINAÇÃO)
--------------------------------------------------
- Reflexo existe, mas está escuro demais.
- Teste: multiplicar reflectionColor por 2.0.

==================================================
TESTE DE DEBUG DEFINITIVO
--------------------------------------------------
No fragment shader do vidro, usar:

fragColor = texture(uReflectionTexture, vTexCoord);

Resultados:
- Se aparecer preto: framebuffer ou câmera estão errados.
- Se aparecer imagem: erro está no cálculo da reflexão.

==================================================
CONCLUSÃO
--------------------------------------------------
Se a reflexão não aparece, então pelo menos UMA das seguintes
afirmações é verdadeira:

1) O framebuffer está vazio
2) A câmera refletida está errada
3) As UVs da reflexão nunca são válidas
4) O Fresnel é sempre zero
5) O depth buffer está bloqueando

Não existe outra causa possível nesse pipeline.
==================================================

