const { Plugin, Notice } = require('obsidian');

class AutoCopy extends Plugin {
    async onload() {
        console.log('Loading Auto Copy');
        
        this.enabled = true;
        this.lastText = '';
        this.visualEffect = null;

        // Слушаем выделение текста
        this.registerEvent(
            this.app.workspace.on('active-leaf-change', () => {
                this.setupSelectionListener();
            })
        );

        // Настраиваем начальный слушатель
        this.setupSelectionListener();

        // Команда переключения
        this.addCommand({
            id: 'toggle-auto-copy',
            name: 'Toggle Auto Copy',
            callback: () => {
                this.enabled = !this.enabled;
                this.updateStatusBar();
                new Notice(`Auto Copy: ${this.enabled ? 'ON' : 'OFF'}`);
            }
        });

        // Статус
        this.statusBar = this.addStatusBarItem();
        this.updateStatusBar();

        console.log('Auto Copy loaded');
    }

    setupSelectionListener() {
        // Удаляем старые слушатели
        document.removeEventListener('selectionchange', this.selectionHandler);
        
        // Добавляем новый слушатель
        this.selectionHandler = () => {
            if (!this.enabled) return;
            
            setTimeout(() => {
                const selection = window.getSelection();
                const selectedText = selection.toString().trim();
                
                if (selectedText && selectedText !== this.lastText) {
                    // Показываем эффект перед копированием
                    this.showVisualEffect(selection);
                    this.copySelection(selectedText);
                    this.lastText = selectedText;
                }
            }, 300);
        };

        document.addEventListener('selectionchange', this.selectionHandler);
    }

    async copySelection(text) {
        try {
            // Пробуем современный API
            if (navigator.clipboard) {
                await navigator.clipboard.writeText(text);
            } else {
                const input = document.createElement('textarea');
                input.value = text;
                input.style.cssText = 'position:absolute;left:-9999px;';
                document.body.appendChild(input);
                input.select();
                document.execCommand('copy');
                document.body.removeChild(input);
            }
            
            new Notice(`📋 Copied: ${text.substring(0, 25)}${text.length > 25 ? '...' : ''}`);
            
        } catch (err) {
            console.log('Copy error:', err);
        }
    }

    showVisualEffect(selection) {
        // Удаляем предыдущий эффект, если есть
        if (this.visualEffect) {
            this.visualEffect.remove();
            this.visualEffect = null;
        }

        // Получаем диапазон выделения
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        
        // Создаем элемент для визуального эффекта
        this.visualEffect = document.createElement('div');
        this.visualEffect.className = 'auto-copy-effect';
        
        // Стили для эффекта
        Object.assign(this.visualEffect.style, {
            position: 'fixed',
            left: `${rect.left}px`,
            top: `${rect.top}px`,
            width: `${rect.width}px`,
            height: `${rect.height}px`,
            backgroundColor: 'rgba(0, 183, 255, 0.3)',
            //border: '2px solid rgba(46, 170, 220, 0.8)', // можно рамку сделать еще
            //borderRadius: '3px',  // радиус скругления углов рамки
            pointerEvents: 'none',
            zIndex: '9999',
            transition: 'all 0.3s ease-out',
            animation: 'AutoCopyPulse 0.5s ease-in-out'
        });

        // Добавляем стили для анимации, если их еще нет
        if (!document.querySelector('#auto-copy-styles')) {
            const style = document.createElement('style');
            style.id = 'auto-copy-styles';
            style.textContent = `
                @keyframes AutoCopyPulse {
                    0% {
                        background-color: rgba(46, 170, 220, 0.3);
                        transform: scale(1);
                    }
                    50% {
                        background-color: rgba(46, 220, 170, 0.5);
                        transform: scale(1.02);
                    }
                    100% {
                        background-color: rgba(46, 170, 220, 0.3);
                        transform: scale(1);
                    }
                }
                
                @keyframes AutoCopyFadeOut {
                    from {
                        opacity: 1;
                        transform: scale(1);
                    }
                    to {
                        opacity: 0;
                        transform: scale(1.1);
                    }
                }
                
                .auto-copy-effect.fade-out {
                    animation: AutoCopyFadeOut 0.5s ease-in-out forwards;
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(this.visualEffect);

        // Удаляем эффект через 1.5 секунды с анимацией исчезновения
        setTimeout(() => {
            if (this.visualEffect) {
                this.visualEffect.classList.add('fade-out');
                setTimeout(() => {
                    if (this.visualEffect) {
                        this.visualEffect.remove();
                        this.visualEffect = null;
                    }
                }, 500);
            }
        }, 1500);
    }

    updateStatusBar() {
        this.statusBar.setText(`SCopy: ${this.enabled ? 'ON' : 'OFF'}`);
        this.statusBar.style.color = this.enabled ? 'var(--text-accent)' : 'var(--text-muted)';
    }

    onunload() {
        document.removeEventListener('selectionchange', this.selectionHandler);
        if (this.visualEffect) {
            this.visualEffect.remove();
        }
        const styles = document.querySelector('#auto-copy-styles');
        if (styles) {
            styles.remove();
        }
    }
}

module.exports = AutoCopy;