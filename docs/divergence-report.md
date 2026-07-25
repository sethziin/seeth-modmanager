# Divergence Classification Report

## Classification Categories

| Categoria | Significado | Ação |
|-----------|-------------|------|
| **A** | Documentação incorreta/desatualizada | Atualizar documentação para refletir o código |
| **B** | Código incompleto | Manter documentação como spec; código será implementado depois |
| **C** | Mudança intencional de produto | Atualizar documentação + criar ADR |

---

## D01 — Fonte: Geist vs DM Sans + Outfit + JetBrains Mono

- **Classificação**: **C** — Mudança intencional de produto
- **Justificativa**: O usuário solicitou a troca de fonte durante sessão anterior como parte do Anti-Slop audit (Impeccable detector flagou Geist como overused font). A mudança foi aplicada no código, mas nunca documentada.
- **Ação recomendada**: Atualizar `01-PROJECT_CONTEXT.md`, `02-STACK.md`, `14-THEMING.md` e `20-DECISIONS.md` (ADR-010) para refletir o novo trio tipográfico.
- **Documentos afetados**: `01-PROJECT_CONTEXT.md`, `02-STACK.md`, `14-THEMING.md`, `20-DECISIONS.md`
- **Impacto na implementação**: Nenhum — código já reflete a decisão correta.

---

## D02 — ADR-010 desatualizado

- **Classificação**: **C** — Consequência de D01
- **Justificativa**: ADR-010 ainda registra Geist como primary typeface. O ADR precisa ser atualizado para a nova decisão.
- **Ação recomendada**: Substituir ADR-010 com a nova decisão tipográfica.
- **Documentos afetados**: `20-DECISIONS.md`
- **Impacto na implementação**: Nenhum.

---

## D03 — Sidebar width: 240px vs 256px

- **Classificação**: **C** — Mudança intencional de produto
- **Justificativa**: A largura foi ajustada durante iterações de design (240 → 280 → 256) a pedido do usuário. O valor final de 256px é intencional.
- **Ação recomendada**: Atualizar `01-PROJECT_CONTEXT.md` para refletir `--sidebar-width: 256px`.
- **Documentos afetados**: `01-PROJECT_CONTEXT.md`
- **Impacto na implementação**: Nenhum.

---

## D04 — Steam detection via appid vs hardcoded paths

- **Classificação**: **B** — Código incompleto
- **Justificativa**: `08-GAME_SYSTEM.md` especifica "Check Steam library folders for appid 271590". O código atual usa caminhos hardcoded (`C:\Program Files (x86)\Steam\...`, `D:\SteamLibrary\...`). A especificação está correta — o código é que está incompleto. Caminhos hardcoded são um fallback válido, mas a detecção via bibliotecas Steam é superior.
- **Ação recomendada**: Manter `08-GAME_SYSTEM.md` como spec. Implementar detecção via Steam library folders posteriormente.
- **Documentos afetados**: Nenhum.
- **Impacto na implementação**: Baixo — funcionalidade adicional, não bloqueante.

---

## D05 — Rockstar Games Launcher detection não implementada

- **Classificação**: **B** — Código incompleto
- **Justificativa**: `08-GAME_SYSTEM.md` menciona verificação do Rockstar Launcher. O código atual só checa a chave de registro direta do GTA V. A detecção do Launcher seria mais robusta.
- **Ação recomendada**: Manter `08-GAME_SYSTEM.md` como spec. Implementar posteriormente.
- **Documentos afetados**: Nenhum.
- **Impacto na implementação**: Baixo.

---

## D06 — validateMod é stub

- **Classificação**: **B** — Código incompleto
- **Justificativa**: `08-GAME_SYSTEM.md` especifica "Inspects .asi, .dll, and .rpf files for compatibility and validity". O código atual só executa `fileExists`. A especificação está correta.
- **Ação recomendada**: Manter doc como spec. Implementar validação real durante o Implementation Plan.
- **Documentos afetados**: Nenhum.
- **Impacto na implementação**: **Alto** — essencial para o pipeline de instalação funcionar.

---

## D07 — installMod é stub

- **Classificação**: **B** — Código incompleto
- **Justificativa**: `GTAVProvider.installMod()` retorna `installedFiles: []` sem copiar arquivos. A arquitetura (docs 03, 05-installation-pipeline, 09) especifica o fluxo correto. O código precisa ser implementado.
- **Ação recomendada**: Manter docs como spec. Implementar no Implementation Plan.
- **Documentos afetados**: Nenhum.
- **Impacto na implementação**: **Alto** — core da aplicação.

---

## D08 — Enable/Disable não move arquivos

- **Classificação**: **B** — Código incompleto
- **Justificativa**: `09-MOD_SYSTEM.md` define staging directory strategy. O código só altera flag booleana. A especificação está correta.
- **Ação recomendada**: Manter doc como spec. Implementar staging de arquivos no Implementation Plan.
- **Documentos afetados**: Nenhum.
- **Impacto na implementação**: **Alto**.

---

## D09 — Conflict detection ausente

- **Classificação**: **B** — Código incompleto
- **Justificativa**: `09-MOD_SYSTEM.md` define detecção de conflitos. Nenhuma lógica existe no código.
- **Ação recomendada**: Manter doc como spec. Implementar no Implementation Plan.
- **Documentos afetados**: Nenhum.
- **Impacto na implementação**: **Médio** — pode ser simplificado na v1 inicial.

---

## D10 — PathResolver ausente

- **Classificação**: **B** — Código incompleto
- **Justificativa**: `08-file-layout.md` define um PathResolver centralizado. O código atual tem caminhos hardcoded em `main.ts`.
- **Ação recomendada**: Manter `08-file-layout.md` como spec. Implementar PathResolver como parte da refatoração de serviços.
- **Documentos afetados**: Nenhum.
- **Impacto na implementação**: **Médio** — refatoração necessária mas não bloqueante.

---

## D11 — Dev/Prod data dir separation ausente

- **Classificação**: **B** — Código incompleto
- **Justificativa**: `ARCHITECTURE_DECISIONS.md` (Decisão 12) especifica separação dev/prod. O código não implementa.
- **Ação recomendada**: Manter doc como spec. Implementar no início do Implementation Plan para evitar corrupção de dados durante desenvolvimento.
- **Documentos afetados**: Nenhum.
- **Impacto na implementação**: **Médio** — importante para segurança de dados em dev.

---

## D12 — Archive extraction ausente

- **Classificação**: **B** — Código incompleto
- **Justificativa**: `03-ARCHITECTURE.md` e `07-package-format.md` especificam extração de zip/7z/rar. Nenhuma lib ou serviço existe.
- **Ação recomendada**: Manter docs como spec. Adicionar dependência e implementar ArchiveService.
- **Documentos afetados**: Nenhum.
- **Impacto na implementação**: **Alto** — essencial para o pipeline.

---

## D13 — CatalogService e DependencyService ausentes

- **Classificação**: **B** — Código incompleto
- **Justificativa**: `02-catalog.md` e `04-dependencies.md` definem estes serviços. Não existem no código.
- **Ação recomendada**: Manter docs como spec. Prioridade média — podem ser implementados após o pipeline principal.
- **Documentos afetados**: Nenhum.
- **Impacto na implementação**: **Baixo** na v1 inicial (BrowseModsPage pode continuar "Coming Soon").

---

## D14 — uninstallMod não deleta arquivos

- **Classificação**: **B** — Código incompleto
- **Justificativa**: `09-MOD_SYSTEM.md` especifica remoção de arquivos + restore de backup. O código só remove entrada do registry.
- **Ação recomendada**: Manter doc como spec. Implementar no Implementation Plan junto com installMod.
- **Documentos afetados**: Nenhum.
- **Impacto na implementação**: **Alto**.

---

## D15 — Dependências de archive/download faltando no package.json

- **Classificação**: **B** — Código incompleto
- **Justificativa**: `02-STACK.md` lista `archiver`, `decompress`, `chokidar`, `got`/`undici`. Nenhuma está no `package.json`.
- **Ação recomendada**: **Esclarecimento necessário**: `02-STACK.md` lista estas como "Key Libraries" mas **nenhuma decisão arquitetural formal (ADR/ADE) as aprovou**. `DownloadService` atual usa `fetch()` nativo do Node (sem `got`/`undici`). Para extração de archives, uma lib será necessária. Propor ADR para a escolha da lib de archive.
- **Documentos afetados**: `02-STACK.md` (atualizar para refletir escolhas reais) + novo ADR em `20-DECISIONS.md`
- **Impacto na implementação**: **Médio** — necessário escolher lib de archive antes de implementar extração.

---

## D16 — TitleBar com navegação removida

- **Classificação**: **C** — Mudança intencional de produto
- **Justificativa**: O usuário solicitou a remoção ("se decida, tem a sidebar e a topbar"). A navegação duplicada foi removida da TitleBar, mantendo apenas a SideNav.
- **Ação recomendada**: Criar ADR para a decisão. Atualizar `03-ARCHITECTURE.md` para refletir TitleBar sem navegação. Atualizar `04-CODING_STANDARDS.md` se necessário.
- **Documentos afetados**: `03-ARCHITECTURE.md`, `20-DECISIONS.md` (novo ADR)
- **Impacto na implementação**: Nenhum — código já reflete a decisão.

---

## I01 — coverUrl externa vs fallback local não usado

- **Classificação**: **A** — Documentação desatualizada
- **Justificativa**: O arquivo `public/gta5_cover.jpg` é um artefato morto do caminho antigo `/gta5_cover.jpg`. O provider agora usa URL externa da Rockstar. O arquivo pode ser removido, mas não há documentação a atualizar.
- **Ação recomendada**: Remover `public/gta5_cover.jpg` como limpeza de código.
- **Documentos afetados**: Nenhum.
- **Impacto na implementação**: Nenhum.

---

## I02 — icons.css: import Geist removido (correto)

- **Classificação**: **A** — Já reflete D01/C. Ação já concluída no código.
- **Ação recomendada**: Nenhuma — código já está correto. Documentação já será atualizada via D01/D02.
- **Documentos afetados**: Nenhum.
- **Impacto na implementação**: Nenhum.

---

## I03 — DownloadService funcional mas nunca chamado pela UI

- **Classificação**: **B** — Código incompleto
- **Justificativa**: O serviço está completo e testado. A integração com a UI (DownloadsPage) não foi implementada. Isso está alinhado com o Roadmap — a página de downloads e o fluxo de instalação via download serão implementados.
- **Ação recomendada**: Manter como pendente. Fazer parte do Implementation Plan.
- **Documentos afetados**: Nenhum.
- **Impacto na implementação**: **Médio** — necessário para fluxo completo.

---

## I04 — DragDropProvider só mostra toast

- **Classificação**: **B** — Código incompleto
- **Justificativa**: O provider existe mas não chama `mod:install`. A implementação correta depende do pipeline de instalação estar pronto.
- **Ação recomendada**: Implementar após o pipeline de instalação estar funcional.
- **Documentos afetados**: Nenhum.
- **Impacto na implementação**: **Baixo** — pode ser implementado após o core.

---

## I05 — BrowseModsPage vazia

- **Classificação**: **B** — Código incompleto
- **Justificativa**: Página "Coming Soon". Depende do CatalogService.
- **Ação recomendada**: Manter como "Coming Soon" na v1 inicial. Implementar CatalogService posteriormente.
- **Documentos afetados**: Nenhum.
- **Impacto na implementação**: **Baixo** — não bloqueante para v1.

---

## I06 — BackupService chamado com listas vazias

- **Classificação**: **B** — Código incompleto
- **Justificativa**: Consequência direta de validateMod ser stub (validation.mod?.files é undefined → backupFiles = []). Será resolvido quando o pipeline de instalação for implementado.
- **Ação recomendada**: Resolver como parte da implementação do pipeline de instalação.
- **Documentos afetados**: Nenhum.
- **Impacto na implementação**: **Médio** — resolvido junto com D06/D07.

---

## I07 — Mods instalados com metadados "Unknown"

- **Classificação**: **B** — Código incompleto
- **Justificativa**: Consequência de validateMod não parsear o archive. Será resolvido com a implementação do ManifestReader.
- **Ação recomendada**: Resolver como parte da implementação do pipeline.
- **Documentos afetados**: Nenhum.
- **Impacto na implementação**: **Médio** — resolvido junto com D06.

---

## D17 — Package format: docs descrevem wrapper `files/`, V1 espera estrutura flat

- **Classificação**: **A** — Documentação incorreta/desatualizada (em relação ao comportamento real do código V1)
- **Justificativa**: `07-package-format.md` documenta a estrutura padrão com `mod.json` + pasta `files/` (caminhos relativos à pasta `files/`, ex.: `files/ScriptHookV.dll`). Porém o código V1 **não suporta o prefixo `files/`**. Rastreio confirmado em código:
  1. `archive-service.extractAll()` extrai **todas** as entradas preservando `entryName` → `files/EntropicLibrary.asi` vira `staging/files/EntropicLibrary.asi`.
  2. `manifest-reader.buildModArchive()` filtra com `availableFiles.includes(f.source)` e define `relativePath = f.destination`.
  3. `mod-installer.install()` copia de `path.join(stagingDir, f.relativePath)`.
  - Se o ZIP usar `files/`: `source: "EntropicLibrary.asi"` falha no `includes` (available = `"files/EntropicLibrary.asi"`) → `files.length === 0` → erro *"Mod archive contains no files to install"*. Ou `source: "files/EntropicLibrary.asi"` passa no filtro mas o installer procura em `staging/EntropicLibrary.asi` (não existe) → skip silencioso, nada instala.
  - **Conclusão**: a única estrutura que o V1 instala de fato é **FLAT** (`mod.json` na raiz + arquivos nos paths relativos ao jogo, sem prefixo `files/`).
- **Decisão V1 (acordada 2026-07-25)**: Aceitar FLAT no V1. Não corrigir o installer agora. Pendente definição futura:
  - **Opção 1**: alterar o código (`extractAll`/`buildModArchive`) para aceitar/stripar o prefixo `files/`; ou
  - **Opção 2**: oficializar FLAT como formato definitivo e atualizar `07-package-format.md`.
- **Ação recomendada**: Por ora, NENHUMA alteração de código. Empacotar mods em formato FLAT. Registrar issue no GitHub para decidir Opção 1 vs 2.
- **Documentos afetados**: `07-package-format.md` (atualizar quando a decisão de formato for finalizada)
- **Impacto na implementação**: **Baixo** — só afeta a geração de pacotes, não o runtime. Pacote VIEWPOINT V1 gerado em formato FLAT validado.
- **Issue**: "07-package-format.md describes files/ wrapper, but V1 implementation expects flat archive structure." (a abrir no GitHub — repo privado `sethziin/seeth-modmanager`)

---

## Resumo das Ações

### Documentos a Atualizar (Categoria A + C)

| Documento | Ação | Referência |
|-----------|------|------------|
| `01-PROJECT_CONTEXT.md` | Atualizar fonte (Geist → DM Sans + Outfit + JetBrains Mono), sidebar (240px → 256px) | D01, D03 |
| `02-STACK.md` | Atualizar font references, esclarecer libs de archive/download | D01, D15 |
| `03-ARCHITECTURE.md` | Atualizar TitleBar (sem navegação) | D16 |
| `14-THEMING.md` | Atualizar font family | D01 |
| `20-DECISIONS.md` | Atualizar ADR-010, adicionar ADRs para font change e TitleBar nav removal | D02, D16 |
| `public/gta5_cover.jpg` | Remover artefato morto | I01 |

### Documentos a Manter (Categoria B — código será implementado)

`03-ARCHITECTURE.md` (parcial), `08-GAME_SYSTEM.md`, `09-MOD_SYSTEM.md`, `02-catalog.md`, `03-manifest.md`, `04-dependencies.md`, `05-installation-pipeline.md`, `07-package-format.md`, `08-file-layout.md`, `ARCHITECTURE_DECISIONS.md`

Nenhuma alteração — os specs estão corretos como fonte de verdade arquitetural.

---

## Novos ADRs Necessários

### ADR-NEW-01: Substituição de Geist por DM Sans + Outfit + JetBrains Mono
- **Status**: Aprovado (já implementado no código)
- **Motivação**: Impeccable detector flagou Geist como overused font de AI slop
- **Decisão**: DM Sans (body) + Outfit (display/headings) + JetBrains Mono (code)

### ADR-NEW-02: Navegação Unificada na Sidebar (TitleBar sem navegação)
- **Status**: Aprovado (já implementado no código)
- **Motivação**: Duplicação de navegação entre TitleBar e SideNav causava inconsistência
- **Decisão**: Sidebar é o único mecanismo de navegação primária. TitleBar contém apenas brand + window controls.

### ADR-NEW-03: Lib de Archive Extraction (pendente)
- **Status**: Pendente — precisa ser decidido antes da implementação
- **Opções**: `adm-zip` (somente zip), `extract-zip` (somente zip), `decompress` (zip + 7z + rar), `node-stream-zip` (somente zip)
- **Recomendação**: Usar `adm-zip` para suporte a ZIP + `node-7z` para 7z, ou `decompress` como solução única
