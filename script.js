// DOM要素の取得
const clearBtn = document.getElementById('clear-btn');
const totalAmountDisplay = document.getElementById('total-amount');
const expectedAmountInput = document.getElementById('expected-amount');
const differenceSection = document.getElementById('difference-section');
const differenceAmount = document.getElementById('difference-amount');
const differenceStatus = document.getElementById('difference-status');
const breakdownSection = document.getElementById('breakdown-section');
const breakdownContent = document.getElementById('breakdown-content');

// 通貨の定義
const currencies = [
    // 紙幣
    { id: 'bill-10000', name: '一万円札', value: 10000, type: 'bill' },
    { id: 'bill-5000', name: '五千円札', value: 5000, type: 'bill' },
    { id: 'bill-2000', name: '二千円札', value: 2000, type: 'bill' },
    { id: 'bill-1000', name: '千円札', value: 1000, type: 'bill' },
    // 硬貨
    { id: 'coin-500', name: '五百円玉', value: 500, type: 'coin' },
    { id: 'coin-100', name: '百円玉', value: 100, type: 'coin' },
    { id: 'coin-50', name: '五十円玉', value: 50, type: 'coin' },
    { id: 'coin-10', name: '十円玉', value: 10, type: 'coin' },
    { id: 'coin-5', name: '五円玉', value: 5, type: 'coin' },
    { id: 'coin-1', name: '一円玉', value: 1, type: 'coin' },
    // 棒金
    { id: 'roll-500', name: '五百円棒金', value: 25000, type: 'roll' },
    { id: 'roll-100', name: '百円棒金', value: 5000, type: 'roll' },
    { id: 'roll-50', name: '五十円棒金', value: 2500, type: 'roll' },
    { id: 'roll-10', name: '十円棒金', value: 500, type: 'roll' },
    { id: 'roll-5', name: '五円棒金', value: 250, type: 'roll' },
    { id: 'roll-1', name: '一円棒金', value: 50, type: 'roll' }
];

// 金額フォーマット関数
function formatAmount(amount) {
    return amount.toLocaleString('ja-JP') + '円';
}

// 合計金額計算関数
function calculateTotal() {
    let total = 0;
    
    currencies.forEach(currency => {
        const input = document.getElementById(currency.id);
        const count = parseInt(input.value) || 0;
        total += count * currency.value;
    });
    
    return total;
}

// 差額分析関数
function analyzeDifference(actual, expected) {
    const difference = actual - expected;
    const absOffset = Math.abs(difference);
    
    const suggestions = [];
    
    if (difference === 0) {
        return {
            status: '一致',
            message: '理論金額と実際の金額が一致しています。',
            suggestions: []
        };
    }
    
    const status = difference > 0 ? '過多' : '不足';
    const message = difference > 0 
        ? `理論金額より${formatAmount(absOffset)}多いです。`
        : `理論金額より${formatAmount(absOffset)}不足しています。`;
    
    // 各通貨での説明可能性をチェック
    currencies.forEach(currency => {
        if (absOffset % currency.value === 0) {
            const count = absOffset / currency.value;
            suggestions.push({
                type: 'exact',
                description: `${currency.name}が${count}${getUnit(currency.type)}${difference > 0 ? '多い' : '少ない'}可能性があります。`,
                checked: false,
                id: `suggestion-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
            });
        }
    });
    
    // 複数通貨の組み合わせでの説明可能性をチェック（簡単なケース）
    if (suggestions.length === 0) {
        findCombinations(absOffset, suggestions, difference > 0);
    }
    
    return {
        status,
        message,
        suggestions
    };
}

// 通貨の単位を取得
function getUnit(type) {
    switch (type) {
        case 'bill':
        case 'coin':
            return '枚';
        case 'roll':
            return '本';
        default:
            return '';
    }
}

// 通貨の組み合わせを探す関数
function findCombinations(targetAmount, suggestions, isExcess) {
    // 主要な通貨での組み合わせをチェック
    const mainCurrencies = [
        { value: 10000, name: '一万円札', unit: '枚' },
        { value: 5000, name: '五千円札', unit: '枚' },
        { value: 1000, name: '千円札', unit: '枚' },
        { value: 500, name: '五百円玉', unit: '枚' },
        { value: 100, name: '百円玉', unit: '枚' },
        { value: 50, name: '五十円玉', unit: '枚' },
        { value: 10, name: '十円玉', unit: '枚' },
        { value: 5, name: '五円玉', unit: '枚' },
        { value: 1, name: '一円玉', unit: '枚' }
    ];
    
    // 2つの通貨の組み合わせをチェック
    for (let i = 0; i < mainCurrencies.length - 1; i++) {
        for (let j = i + 1; j < mainCurrencies.length; j++) {
            const curr1 = mainCurrencies[i];
            const curr2 = mainCurrencies[j];
            
            // 各通貨の最大計算可能数を制限
            const maxCount = 10;
            
            for (let count1 = 1; count1 <= maxCount; count1++) {
                for (let count2 = 1; count2 <= maxCount; count2++) {
                    if (count1 * curr1.value + count2 * curr2.value === targetAmount) {
                        suggestions.push({
                            type: 'possible',
                            description: `${curr1.name}${count1}${curr1.unit}と${curr2.name}${count2}${curr2.unit}が${isExcess ? '多い' : '少ない'}可能性があります。`,
                            checked: false,
                            id: `suggestion-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
                        });
                        if (suggestions.length >= 3) return; // 最大3つまで
                    }
                }
            }
        }
    }
    
    // 単一通貨で近似値をチェック
    if (suggestions.length === 0) {
        mainCurrencies.forEach(currency => {
            const count = Math.round(targetAmount / currency.value);
            if (count > 0 && count <= 20) {
                const approximateAmount = count * currency.value;
                const error = Math.abs(approximateAmount - targetAmount);
                if (error <= targetAmount * 0.1) { // 10%以内の誤差
                    suggestions.push({
                        type: 'possible',
                        description: `${currency.name}約${count}${currency.unit}の${isExcess ? '過多' : '不足'}（誤差${formatAmount(error)}）`,
                        checked: false,
                        id: `suggestion-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
                    });
                }
            }
        });
    }
}

// 計算実行関数
function performCalculation() {
    const total = calculateTotal();
    const expected = parseInt(expectedAmountInput.value) || 0;
    
    // 合計金額表示
    totalAmountDisplay.textContent = formatAmount(total);
    
    // 理論金額が入力されている場合のみ差額分析を実行
    if (expected > 0) {
        const analysis = analyzeDifference(total, expected);
        
        // 差額セクション表示
        differenceSection.style.display = 'block';
        differenceAmount.textContent = formatAmount(Math.abs(total - expected));
        differenceStatus.textContent = analysis.message;
        
        // 差額のスタイル設定
        differenceSection.className = 'difference';
        if (total > expected) {
            differenceSection.classList.add('positive');
        } else if (total < expected) {
            differenceSection.classList.add('negative');
        }
        
        // 差額分析結果表示
        if (analysis.suggestions.length > 0) {
            breakdownSection.style.display = 'block';
            displaySuggestions(analysis.suggestions);
        } else {
            breakdownContent.innerHTML = '<div class="breakdown-item">明確な原因を特定できませんでした。再度確認してください。</div>';
            breakdownSection.style.display = 'block';
        }
    } else {
        differenceSection.style.display = 'none';
        breakdownSection.style.display = 'none';
    }
}

// 提案の表示とソート機能
function displaySuggestions(suggestions) {
    // チェック状態でソート（チェック済みを下に）
    const sortedSuggestions = [...suggestions].sort((a, b) => {
        if (a.checked && !b.checked) return 1;
        if (!a.checked && b.checked) return -1;
        return 0;
    });
    
    breakdownContent.innerHTML = '';
    
    sortedSuggestions.forEach(suggestion => {
        const item = document.createElement('div');
        item.className = `breakdown-item ${suggestion.type} ${suggestion.checked ? 'checked' : ''}`;
        item.setAttribute('data-id', suggestion.id);
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'suggestion-checkbox';
        checkbox.checked = suggestion.checked;
        checkbox.addEventListener('change', () => handleCheckboxChange(suggestion.id, checkbox.checked));
        
        const label = document.createElement('label');
        label.className = 'suggestion-label';
        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(suggestion.description));
        
        // ラベルクリックでチェックボックスをトグル
        label.addEventListener('click', (e) => {
            if (e.target !== checkbox) {
                e.preventDefault();
                checkbox.checked = !checkbox.checked;
                handleCheckboxChange(suggestion.id, checkbox.checked);
            }
        });
        
        item.appendChild(label);
        breakdownContent.appendChild(item);
    });
}

// チェックボックスの変更処理
function handleCheckboxChange(suggestionId, isChecked) {
    if (isChecked) {
        // 該当する提案の内容を取得
        const suggestionElement = document.querySelector(`[data-id="${suggestionId}"] .suggestion-label`);
        const suggestionText = suggestionElement ? suggestionElement.textContent.trim() : 'この項目';
        
        showConfirmModal('確認しましたか？', `「${suggestionText}」を確認済みとしてマークします。`, (confirmed) => {
            if (confirmed) {
                // 提案のチェック状態を更新
                updateSuggestionState(suggestionId, true);
                // 再計算して表示を更新
                performCalculation();
            } else {
                // チェックを元に戻す
                const checkbox = document.querySelector(`[data-id="${suggestionId}"] .suggestion-checkbox`);
                checkbox.checked = false;
            }
        });
    } else {
        // チェックを外す場合は確認なし
        updateSuggestionState(suggestionId, false);
        performCalculation();
    }
}

// カスタムモーダルダイアログの表示
function showConfirmModal(title, message, callback) {
    // モーダルHTML作成
    const modalHTML = `
        <div class="modal-overlay" id="confirmModal">
            <div class="modal-content">
                <div class="modal-title">${title}</div>
                <div class="modal-message">${message}</div>
                <div class="modal-buttons">
                    <button class="modal-btn modal-btn-primary" id="modalConfirm">はい</button>
                    <button class="modal-btn modal-btn-secondary" id="modalCancel">いいえ</button>
                </div>
            </div>
        </div>
    `;
    
    // モーダルをDOMに追加
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    const modal = document.getElementById('confirmModal');
    const confirmBtn = document.getElementById('modalConfirm');
    const cancelBtn = document.getElementById('modalCancel');
    
    // モーダル表示
    setTimeout(() => modal.classList.add('show'), 10);
    
    // ボタンイベント
    confirmBtn.addEventListener('click', () => {
        closeModal(modal);
        callback(true);
    });
    
    cancelBtn.addEventListener('click', () => {
        closeModal(modal);
        callback(false);
    });
    
    // オーバーレイクリックで閉じる
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal(modal);
            callback(false);
        }
    });
    
    // ESCキーで閉じる
    const handleEscape = (e) => {
        if (e.key === 'Escape') {
            closeModal(modal);
            callback(false);
            document.removeEventListener('keydown', handleEscape);
        }
    };
    document.addEventListener('keydown', handleEscape);
}

// モーダルを閉じる
function closeModal(modal) {
    modal.classList.remove('show');
    setTimeout(() => {
        if (modal.parentNode) {
            modal.parentNode.removeChild(modal);
        }
    }, 300);
}

// 提案のチェック状態を更新
function updateSuggestionState(suggestionId, isChecked) {
    // 現在の分析結果から該当する提案を見つけて更新
    const total = calculateTotal();
    const expected = parseInt(expectedAmountInput.value) || 0;
    
    if (expected > 0) {
        const analysis = analyzeDifference(total, expected);
        const suggestion = analysis.suggestions.find(s => s.id === suggestionId);
        if (suggestion) {
            suggestion.checked = isChecked;
        }
    }
}

// クリア関数
function clearAll() {
    currencies.forEach(currency => {
        document.getElementById(currency.id).value = '0';
    });
    expectedAmountInput.value = '100000';
    totalAmountDisplay.textContent = '0円';
    differenceSection.style.display = 'none';
    breakdownSection.style.display = 'none';
    
    // チェック状態もリセット
    const checkboxes = document.querySelectorAll('.suggestion-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.checked = false;
    });
}

// リアルタイム計算（入力値変更時）
function setupRealTimeCalculation() {
    currencies.forEach(currency => {
        const input = document.getElementById(currency.id);
        input.addEventListener('input', performCalculation);
    });
    expectedAmountInput.addEventListener('input', performCalculation);
}

// イベントリスナーの設定
clearBtn.addEventListener('click', clearAll);

// 初期化
document.addEventListener('DOMContentLoaded', function() {
    setupRealTimeCalculation();
    performCalculation(); // 初期計算実行
});

// キーボードショートカット
document.addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.key === 'Delete') {
        e.preventDefault();
        clearAll();
    }
});

// 入力値の検証
currencies.forEach(currency => {
    const input = document.getElementById(currency.id);
    input.addEventListener('input', function() {
        if (this.value < 0) {
            this.value = 0;
        }
        // 小数点の入力を防ぐ
        if (this.value.includes('.')) {
            this.value = Math.floor(parseFloat(this.value));
        }
    });
});

expectedAmountInput.addEventListener('input', function() {
    if (this.value < 0) {
        this.value = 0;
    }
    if (this.value.includes('.')) {
        this.value = Math.floor(parseFloat(this.value));
    }
});
