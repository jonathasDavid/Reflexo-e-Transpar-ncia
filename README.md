# Trabalho de Computação Gráfica: Reflexo e Transparência

## 📷 Preview

<!-- Adicione sua imagem aqui -->
![Preview do Trabalho](./screenshot.png)

---

## 🎯 Objetivo

Desenvolver um efeito de **reflexo e transparência** em um plano utilizando WebGL/GLSL. O shader simula um material translúcido com reflexo, como um vidro escuro.

---

## ✅ Requisitos Técnicos Implementados

### 1. Shader Customizado
- Implementação própria dos shaders vertex e fragment
- O shader calcula a reflexão e a transparência com base no ângulo de visão (efeito Fresnel)
- Não são utilizadas texturas prontas para reflexão

### 2. Reflexo e Transparência Dinâmicos
- Reflexo simulado utilizando **framebuffer** renderizado a partir da cena
- Renderização em múltiplos passos (multi-pass rendering)
- Não utiliza cube map

### 3. Transparência Controlada
- Transparência ajustável via **uniform** `uTransparency`
- Controle disponível na interface através de um slider (0-100%)

### 4. Textura Padrão
- Todos os objetos possuem textura padrão aplicada
- Inclusive o próprio plano de vidro

### 5. Clipping Plane
- Utiliza clipping plane para renderização seletiva
- Implementado no vertex/fragment shader

### 6. Câmera Flyby
- Movimento livre pela cena com controles WASD
- Rotação com mouse
- Subir/descer com Space/Shift

---

## 🎮 Controles

| Tecla | Ação |
|-------|------|
| **W/A/S/D** | Movimentar câmera |
| **Mouse** | Olhar ao redor |
| **Space** | Subir |
| **Shift** | Descer |
| **Scroll** | Ajustar velocidade |
| **R** | Resetar câmera |
| **ESC** | Liberar mouse |

---

## 🚀 Como Executar

1. Inicie um servidor local na pasta do projeto:
   ```bash
   python -m http.server 8000
   ```

2. Acesse no navegador:
   ```
   http://localhost:8000
   ```

---

## 📁 Estrutura do Projeto

```
├── index.html          # Página principal
├── js/
│   ├── main.js         # Lógica principal e renderização
│   ├── camera.js       # Sistema de câmera flyby
│   ├── geometry.js     # Criação de geometrias (cubo, esfera, plano)
│   ├── framebuffer.js  # Gerenciamento de framebuffers
│   └── shaders.js      # Utilitários para shaders
├── shaders/
│   ├── vertex.glsl     # Vertex shader dos objetos
│   ├── fragment.glsl   # Fragment shader dos objetos
│   ├── glass.v.glsl    # Vertex shader do vidro
│   └── glass.glsl      # Fragment shader do vidro (Fresnel)
└── textures/           # Texturas utilizadas
```
