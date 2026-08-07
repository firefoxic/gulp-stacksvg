SHELL := bash
.SHELLFLAGS := -euo pipefail -c
.ONESHELL:

export PATH := $(CURDIR)/node_modules/.bin:$(PATH)

ANSI_RESET := \033[0m
ANSI_BOLD := \033[1m
ANSI_BOLD_CYAN := \033[1;36m

help: ## 🧾 Print this message
	$(call print_help)
.PHONY: help

setup: ## 🛠️  Setup the project environment
	@command -v pnpm >/dev/null 2>&1 || \
	(
		printf "\t❌ $(ANSI_BOLD)pnpm not found in PATH$(ANSI_RESET)\n" && \
		printf "\tPlease install pnpm first — https://pnpm.io/installation\n\n" && \
		exit 1
	)
	set -x
	pnpm ci
	git config --local core.hooksPath .githooks
.PHONY: setup

check: ## ✅ Type-check the project
	tsc --noEmit
.PHONY: check

lint: ## 🧬 Lint code by oxlint
	oxlint
.PHONY: lint

fix: ## 🩹 Fix code by oxlint
	oxlint --fix
.PHONY: fix

test: ## 🧪 Run unit tests against the source
	vitest run --project unit
.PHONY: test

watch: ## 👀 Rerun unit tests on every change
	vitest --project unit
.PHONY: watch

coverage: ## 📊 Report the unit test coverage of the source
	vitest run --project unit --coverage
.PHONY: coverage

build: check lint ## 🔨 Build the project
	tsdown
.PHONY: build

test-package: build ## 📦 Test the built package
	vitest run --project package
.PHONY: test-package

verify: check lint test test-package ## ✅ Run every check the CI runs
.PHONY: verify

release: verify ## 🚀 Release a new version
	pnpm dlx @firefoxic/release-it
.PHONY: release

define print_help
	@printf "\n\t📜 $(ANSI_BOLD)Available targets:$(ANSI_RESET)\n\n"
	grep -E '^[a-zA-Z0-9_-]+:.*?## ' $(MAKEFILE_LIST) \
	| awk -F ':|##' '\
	BEGIN { \
		ANSI_BOLD_CYAN = "$(ANSI_BOLD_CYAN)"; \
		ANSI_RESET = "$(ANSI_RESET)"; \
	} \
	{ \
		targets[NR]=$$1; descs[NR]=$$3; \
		if (length($$1) > max) max = length($$1); \
	} \
	END { \
		for (i = 1; i <= NR; i++) { \
			printf "\t%s%" max "s%s —%s\n", ANSI_BOLD_CYAN, targets[i], ANSI_RESET, descs[i]; \
		} \
		printf "\n" \
	}'
endef
