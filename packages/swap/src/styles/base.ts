// language=css
export const baseStyles = `
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}

*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

:host {
  display: block;
  font-family: var(--tf-font);
  color: var(--tf-text);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.tf-container {
  width: 100%;
  max-width: 400px;
  min-width: 360px;
  border-radius: 20px;
  overflow: hidden;
  background: var(--tf-bg);
  border: 1px solid var(--tf-border);
  box-shadow: var(--tf-shadow-lg);
  font-family: var(--tf-font);
  color: var(--tf-text);
  position: relative;
}

.tf-accent-line {
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--tf-accent), transparent);
  opacity: 0.6;
}

/* Header */
.tf-header {
  padding: 18px 20px 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.tf-header-left {
  display: flex;
  align-items: center;
  gap: 7px;
}

.tf-header-left--hidden {
  visibility: hidden;
}

.tf-header-logo-image {
  width: 22px;
  height: 22px;
  object-fit: contain;
  flex-shrink: 0;
}

.tf-header-title {
  font-size: 15px;
  font-weight: 600;
  letter-spacing: -0.01em;
}

.tf-header-title-accent {
  color: var(--tf-accent);
}

.tf-header-right {
  display: flex;
  gap: 6px;
  align-items: center;
}

.tf-wallet-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--tf-accent);
  box-shadow: 0 0 8px var(--tf-accent-glow);
}

.tf-wallet-dot--success {
  background: var(--tf-success);
  box-shadow: 0 0 8px var(--tf-success);
}

.tf-wallet-address {
  font-size: 12px;
  color: var(--tf-text-secondary);
  font-family: var(--tf-font-mono);
}

/* Panels */
.tf-panel-wrapper {
  padding: 14px 20px 0;
}

.tf-panel-wrapper--to {
  padding: 0 20px;
}

.tf-panel {
  background: var(--tf-input-bg);
  border-radius: 14px;
  padding: 14px 16px;
  border: 1px solid var(--tf-border-light);
  transition: border-color 0.2s;
}

.tf-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.tf-panel-header-right {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.tf-panel-label {
  font-size: 12px;
  color: var(--tf-text-tertiary);
  font-weight: 500;
  text-align: left;
}

.tf-panel-balance {
  font-size: 12px;
  color: var(--tf-text-tertiary);
  font-family: var(--tf-font-mono);
}

.tf-panel-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.tf-amount {
  font-size: 28px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--tf-text);
  font-family: var(--tf-font);
  background: none;
  border: none;
  outline: none;
  width: 100%;
  min-width: 0;
  text-align: left;
}

.tf-amount::placeholder {
  color: var(--tf-text-tertiary);
}

.tf-amount--muted {
  color: var(--tf-text-tertiary);
}

.tf-significant-number {
  display: inline-flex;
  align-items: baseline;
}

.tf-significant-zero-count {
  font-size: 0.7em;
  line-height: 1;
  opacity: 0.85;
}

.tf-significant-tooltip {
  cursor: help;
}

.tf-token-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--tf-surface);
  border-radius: 10px;
  padding: 6px 12px 6px 8px;
  height: 36px;
  box-sizing: border-box;
  border: 1px solid var(--tf-border);
  cursor: pointer;
  flex-shrink: 0;
  font-family: var(--tf-font);
}

.tf-token-btn:hover {
  background: var(--tf-surface-hover);
}

.tf-token-btn--select {
  padding: 0 12px;
}

.tf-token-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--tf-text);
}

.tf-token-name--accent {
  font-size: 13px;
  font-weight: 600;
  color: var(--tf-accent);
}

.tf-caret {
  font-size: 10px;
  color: var(--tf-text-tertiary);
}

.tf-panel-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 6px;
  min-height: 16px;
}

.tf-panel-fiat-row {
  margin-top: 6px;
  min-height: 16px;
  display: flex;
  align-items: center;
}

.tf-fiat {
  display: inline-block;
  min-height: 16px;
  font-size: 12px;
  color: var(--tf-text-tertiary);
}

.tf-fiat--hidden {
  visibility: hidden;
}

.tf-max-btn {
  font-size: 11px;
  font-weight: 600;
  color: var(--tf-accent);
  background: var(--tf-accent-light);
  border: none;
  padding: 2px 8px;
  border-radius: 6px;
  cursor: pointer;
  font-family: var(--tf-font);
}

.tf-max-btn:hover {
  opacity: 0.8;
}

/* Swap Arrow */
.tf-swap-arrow {
  display: flex;
  justify-content: center;
  margin: -6px 0;
  position: relative;
  z-index: 2;
}

.tf-swap-arrow-inner {
  width: 36px;
  height: 36px;
  padding: 0;
  appearance: none;
  -webkit-appearance: none;
  border-radius: 10px;
  background: var(--tf-surface);
  border: 3px solid var(--tf-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  font-size: 14px;
  color: var(--tf-text-secondary);
}

/* Quote Preview */
.tf-quote {
  margin: 12px 20px 0;
  padding: 10px 14px;
  background: var(--tf-accent-light);
  border-radius: 10px;
  font-size: 12px;
  color: var(--tf-text-secondary);
}

.tf-quote-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 16px;
  margin-bottom: 4px;
}

.tf-quote-row:last-child {
  margin-bottom: 0;
}

.tf-quote-value {
  font-family: var(--tf-font-mono);
  font-size: 11px;
}

.tf-quote--loading {
  display: block;
}

.tf-quote-skeleton-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.tf-quote-skeleton-label {
  width: 68px;
  height: 10px;
}

.tf-quote-skeleton-label--short {
  width: 56px;
}

.tf-quote-skeleton-value {
  width: 150px;
  height: 10px;
}

.tf-quote-skeleton-value--short {
  width: 126px;
}

.tf-quote-skeleton-value--tiny {
  width: 80px;
}

/* CTA Button */
.tf-cta-wrapper {
  padding: 16px 20px 20px;
}

.tf-cta-wrapper--receive {
  padding: 12px 20px 0;
}

.tf-btn-primary {
  width: 100%;
  padding: 14px 0;
  border-radius: 14px;
  border: none;
  background: linear-gradient(135deg, var(--tf-accent), #5B4CC4);
  color: #fff;
  font-weight: 600;
  font-size: 15px;
  cursor: pointer;
  box-shadow: 0 4px 16px var(--tf-accent-glow);
  letter-spacing: -0.01em;
  font-family: var(--tf-font);
}

.tf-btn-primary:hover {
  opacity: 0.95;
}

.tf-btn-primary--executing {
  background: var(--tf-accent);
  cursor: wait;
  opacity: 0.85;
}

.tf-btn-connect {
  width: 100%;
  padding: 14px 0;
  border-radius: 14px;
  border: 1px solid var(--tf-accent);
  background: var(--tf-accent-light);
  color: var(--tf-accent);
  font-weight: 600;
  font-size: 15px;
  cursor: pointer;
  font-family: var(--tf-font);
}

.tf-btn-success {
  width: 100%;
  padding: 14px 0;
  border-radius: 14px;
  text-align: center;
  background: var(--tf-success-bg);
  color: var(--tf-success);
  font-weight: 600;
  font-size: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: none;
}

.tf-btn-error {
  width: 100%;
  padding: 14px 0;
  border-radius: 14px;
  text-align: center;
  background: var(--tf-error-bg);
  color: var(--tf-error);
  font-weight: 600;
  font-size: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: none;
  cursor: pointer;
}

.tf-btn-inner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.tf-spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  animation: spin 0.8s linear infinite;
}

.tf-spinner--sm {
  width: 14px;
  height: 14px;
}

/* Explorer link */
.tf-explorer-link {
  padding: 0 20px 16px;
  text-align: center;
}

.tf-explorer-link a {
  font-size: 12px;
  color: var(--tf-accent);
  text-decoration: none;
  font-family: var(--tf-font-mono);
}

/* Skeleton */
.tf-skeleton {
  border-radius: 6px;
  background: var(--tf-skeleton);
  animation: pulse 1.5s infinite;
}

/* Powered by footer */
.tf-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 12px 0 14px;
  border-top: 1px solid var(--tf-border-light);
  margin: 8px 20px 0;
  text-decoration: none;
}

.tf-footer-text {
  font-size: 11px;
  color: var(--tf-text-tertiary);
}

.tf-footer-brand {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: var(--tf-text-secondary);
}

.tf-footer-arrow {
  color: #2ABCF2;
}

/* Token Icon */
.tf-token-icon {
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 700;
  font-family: var(--tf-font);
  flex-shrink: 0;
  overflow: hidden;
}

.tf-token-icon-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

/* Chain Badge */
.tf-chain-badge {
  font-weight: 600;
  border-radius: 4px;
  letter-spacing: 0.02em;
  white-space: nowrap;
}

.tf-chain-badge--normal {
  font-size: 10px;
  padding: 2px 6px;
}

.tf-chain-badge--compact {
  font-size: 9px;
  padding: 1px 5px;
}

/* Chain Dot */
.tf-chain-dot {
  border-radius: 50%;
  flex-shrink: 0;
  overflow: hidden;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.tf-chain-dot-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
  display: block;
}

/* Token Selector Modal */
.tf-selector-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 20px;
  display: flex;
  align-items: flex-start;
  z-index: 10;
  overflow: hidden;
}

.tf-selector {
  width: 100%;
  max-width: 400px;
  border-radius: 20px;
  overflow: hidden;
  background: var(--tf-bg);
  border: 1px solid var(--tf-border);
  box-shadow: var(--tf-shadow-lg);
  font-family: var(--tf-font);
  color: var(--tf-text);
  height: 100%;
  display: flex;
  flex-direction: column;
}

.tf-selector-header {
  padding: 18px 20px 14px;
  flex-shrink: 0;
}

.tf-selector-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
}

.tf-selector-title {
  font-size: 15px;
  font-weight: 600;
}

.tf-selector-close {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--tf-text-tertiary);
  font-size: 16px;
  font-weight: 300;
  background: var(--tf-input-bg);
  border: none;
  font-family: var(--tf-font);
}

.tf-selector-search {
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--tf-input-bg);
  border-radius: 12px;
  padding: 10px 14px;
  border: 1px solid var(--tf-border-light);
  transition: border-color 0.15s;
}

.tf-selector-search--focused {
  border-color: var(--tf-accent);
}

.tf-selector-search-icon {
  color: var(--tf-text-tertiary);
  font-size: 14px;
  flex-shrink: 0;
}

.tf-selector-search-input {
  flex: 1;
  border: none;
  background: none;
  outline: none;
  font-size: 14px;
  color: var(--tf-text);
  font-family: var(--tf-font);
}

.tf-selector-search-input::placeholder {
  color: var(--tf-text-tertiary);
}

/* Popular tokens */
.tf-popular-tokens {
  display: flex;
  gap: 6px;
  margin-top: 12px;
  flex-wrap: wrap;
}

.tf-popular-token {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px 5px 6px;
  border-radius: 20px;
  border: 1px solid var(--tf-border);
  cursor: pointer;
  background: transparent;
  font-family: var(--tf-font);
}

.tf-popular-token:hover {
  background: var(--tf-accent-light);
}

.tf-popular-token--active {
  background: var(--tf-accent-light);
  border-color: var(--tf-accent);
}

.tf-popular-token-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--tf-text);
}

.tf-popular-token-skeleton {
  height: 31px;
  border-radius: 20px;
}

/* Chain filter */
.tf-chain-filter {
  display: flex;
  gap: 4px;
  margin-top: 12px;
  overflow-x: auto;
  padding-bottom: 2px;
}

.tf-chain-filter-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: 8px;
  border: none;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  font-family: var(--tf-font);
  background: var(--tf-input-bg);
  color: var(--tf-text-secondary);
}

.tf-chain-filter-btn--active {
  background: var(--tf-accent-light);
  color: var(--tf-accent);
  outline: 1px solid var(--tf-accent);
  outline-offset: -1px;
}

.tf-chain-filter-skeleton {
  height: 24px;
  border-radius: 8px;
  flex-shrink: 0;
}

/* Token list */
.tf-selector-divider {
  height: 1px;
  background: var(--tf-border);
  margin: 0 20px;
  flex-shrink: 0;
}

.tf-token-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 6px 8px;
}

.tf-token-list-skeleton {
  display: flex;
  flex-direction: column;
}

.tf-token-list-item-skeleton {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-radius: 12px;
}

.tf-token-list-skeleton-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.tf-token-list-skeleton-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
}

.tf-token-list-skeleton-info {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.tf-token-list-skeleton-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 7px;
}

.tf-token-list-skeleton-line {
  height: 10px;
}

.tf-token-list-skeleton-line--primary {
  width: 88px;
}

.tf-token-list-skeleton-line--secondary {
  width: 64px;
}

.tf-token-list-skeleton-line--balance {
  width: 56px;
}

.tf-token-list-skeleton-line--usd {
  width: 44px;
}

.tf-token-list-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-radius: 12px;
  cursor: pointer;
  background: transparent;
  transition: background 0.1s;
  border: none;
  width: 100%;
  font-family: var(--tf-font);
}

.tf-token-list-item:hover {
  background: var(--tf-surface-hover);
}

.tf-token-list-item--highlighted {
  background: var(--tf-accent-light);
}

.tf-token-list-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.tf-token-list-icon-wrap {
  position: relative;
}

.tf-token-list-chain-indicator {
  position: absolute;
  bottom: -1px;
  right: -1px;
  width: 13px;
  height: 13px;
  border-radius: 50%;
  background: var(--tf-surface);
  border: 1px solid var(--tf-border);
  display: flex;
  align-items: center;
  justify-content: center;
}

.tf-token-list-info {
  text-align: left;
}

.tf-token-list-symbol-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.tf-token-list-symbol {
  font-size: 14px;
  font-weight: 600;
  color: var(--tf-text);
}

.tf-token-list-name {
  font-size: 12px;
  color: var(--tf-text-tertiary);
}

.tf-token-list-right {
  text-align: right;
}

.tf-token-list-balance {
  font-size: 13px;
  font-weight: 500;
  font-family: var(--tf-font-mono);
}

.tf-token-list-balance--zero {
  color: var(--tf-text-tertiary);
}

.tf-token-list-usd {
  font-size: 11px;
  color: var(--tf-text-tertiary);
  font-family: var(--tf-font-mono);
}

/* Receive component specific */
.tf-receive-header {
  padding: 16px 20px 12px;
  display: flex;
  align-items: center;
  gap: 7px;
}

.tf-receive-section {
  padding: 0 20px 10px;
}

.tf-receive-section-label {
  font-size: 11px;
  color: var(--tf-text-tertiary);
  font-weight: 500;
  margin-bottom: 6px;
  text-align: left;
}

.tf-receive-target {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: var(--tf-input-bg);
  border-radius: 12px;
  border: 1px solid var(--tf-border-light);
}

.tf-receive-amount {
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.tf-receive-symbol {
  font-size: 14px;
  font-weight: 500;
  color: var(--tf-text-secondary);
}

.tf-receive-fiat {
  margin-left: auto;
  font-size: 11px;
  color: var(--tf-text-tertiary);
  font-family: var(--tf-font-mono);
}

/* Payment token list */
.tf-pay-token-list {
  padding: 0 20px;
}

.tf-pay-token {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 9px 11px;
  border-radius: 11px;
  margin-bottom: 4px;
  cursor: pointer;
  border: 1px solid var(--tf-border-light);
  background: transparent;
  width: 100%;
  font-family: var(--tf-font);
}

.tf-pay-token--active {
  border-color: var(--tf-accent);
  outline: 0.5px solid var(--tf-accent);
  outline-offset: -1px;
  background: var(--tf-accent-light);
}

.tf-pay-token--disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.tf-pay-token--skeleton {
  cursor: default;
}

.tf-pay-token-left {
  display: flex;
  align-items: center;
  gap: 9px;
}

.tf-pay-token-icon-wrap {
  position: relative;
}

.tf-pay-token-chain-dot {
  position: absolute;
  bottom: -1px;
  right: -1px;
  width: 11px;
  height: 11px;
  border-radius: 50%;
  background: var(--tf-surface);
  border: 1px solid var(--tf-border);
  display: flex;
  align-items: center;
  justify-content: center;
}

.tf-pay-token-info {
  text-align: left;
}

.tf-pay-token-top-row {
  display: flex;
  align-items: center;
  gap: 5px;
}

.tf-pay-token-symbol {
  font-size: 12px;
  font-weight: 600;
  color: var(--tf-text);
}

.tf-best-badge {
  font-size: 8px;
  font-weight: 700;
  padding: 1px 4px;
  border-radius: 3px;
  background: var(--tf-success-bg);
  color: var(--tf-success);
  letter-spacing: 0.03em;
}

.tf-pay-token-balance {
  font-size: 10px;
  color: var(--tf-text-tertiary);
  font-family: var(--tf-font-mono);
}

.tf-pay-token-right {
  text-align: right;
}

.tf-pay-token-amount {
  font-size: 12px;
  font-weight: 600;
  font-family: var(--tf-font-mono);
  color: var(--tf-text);
}

.tf-pay-token-fee {
  font-size: 9px;
  color: var(--tf-text-tertiary);
  font-family: var(--tf-font-mono);
}

.tf-browse-all {
  text-align: center;
  padding: 4px 0 2px;
  font-size: 11px;
  color: var(--tf-accent);
  cursor: pointer;
  font-weight: 500;
  background: none;
  border: none;
  width: 100%;
  font-family: var(--tf-font);
}

.tf-explorer-link--receive {
  text-align: center;
  margin-top: 8px;
  margin-bottom: 10px;
}

.tf-explorer-link--receive a {
  font-size: 11px;
  color: var(--tf-accent);
  text-decoration: none;
  font-family: var(--tf-font-mono);
}
`;
