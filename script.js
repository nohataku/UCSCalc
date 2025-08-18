// DOM要素の取得
const clearBtn = document.getElementById('clear-btn');
const totalAmountDisplay = document.getElementById('total-amount');
const expectedAmountInput = document.getElementById('expected-amount');
const differenceSection = document.getElementById('difference-section');
const differenceAmount = document.getElementById('difference-amount');
const differenceStatus = document.getElementById('difference-status');
const breakdownSection = document.getElementById('breakdown-section');
const breakdownContent = document.getElementById('breakdown-content');

// 小計表示要素
const billsSubtotal = document.getElementById('bills-subtotal');
const rollsSubtotal = document.getElementById('rolls-subtotal');
const coinsSubtotal = document.getElementById('coins-subtotal');

// グローバルな提案状態を保持
let suggestionStates = {};

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

// セクション別小計計算関数
function calculateSubtotals() {
    let billsTotal = 0;
    let rollsTotal = 0;
    let coinsTotal = 0;
    
    // 各通貨の個別小計を計算
    currencies.forEach(currency => {
        const input = document.getElementById(currency.id);
        const count = parseInt(input.value) || 0;
        const value = currency.value;
        const itemTotal = count * value;
        
        // 個別小計を表示
        const subtotalElement = document.getElementById(currency.id + '-subtotal');
        if (subtotalElement) {
            if (count > 0) {
                subtotalElement.textContent = formatAmount(itemTotal);
                subtotalElement.style.display = 'block';
            } else {
                subtotalElement.textContent = '0円';
                subtotalElement.style.display = 'none';
            }
        }
        
        // セクション小計に加算
        if (currency.type === 'bill') {
            billsTotal += itemTotal;
        } else if (currency.type === 'roll') {
            rollsTotal += itemTotal;
        } else if (currency.type === 'coin') {
            coinsTotal += itemTotal;
        }
    });
    
    // セクション小計を表示
    billsSubtotal.textContent = formatAmount(billsTotal);
    rollsSubtotal.textContent = formatAmount(rollsTotal);
    coinsSubtotal.textContent = formatAmount(coinsTotal);
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
    
    // 1. 単一通貨での完全一致をチェック（高優先度）
    currencies.forEach(currency => {
        if (absOffset % currency.value === 0) {
            const count = absOffset / currency.value;
            if (count <= 50) { // 現実的な範囲に制限
                suggestions.push({
                    type: 'exact',
                    priority: 1,
                    description: `${currency.name}が${count}${getUnit(currency.type)}${difference > 0 ? '多い' : '少ない'}`,
                    detail: `${formatAmount(count * currency.value)} = ${currency.name} × ${count}${getUnit(currency.type)}`,
                    checked: false,
                    id: `exact-${currency.id}-${count}`
                });
            }
        }
    });
    
    // 2. 2つの通貨の組み合わせをチェック（中優先度）
    if (suggestions.length < 5) {
        findTwoCurrencyCombinations(absOffset, suggestions, difference > 0);
    }
    
    // 3. 3つの通貨の組み合わせをチェック（低優先度）
    if (suggestions.length < 3) {
        findThreeCurrencyCombinations(absOffset, suggestions, difference > 0);
    }
    
    // 4. 近似値での可能性をチェック
    if (suggestions.length < 5) {
        findApproximateSolutions(absOffset, suggestions, difference > 0);
    }
    
    // 5. 棒金との関連をチェック
    findRollRelatedSolutions(absOffset, suggestions, difference > 0);
    
    // 優先度とタイプでソート
    suggestions.sort((a, b) => {
        if (a.priority !== b.priority) return a.priority - b.priority;
        if (a.type === 'exact' && b.type !== 'exact') return -1;
        if (a.type !== 'exact' && b.type === 'exact') return 1;
        return 0;
    });
    
    // 上位10件に制限
    const limitedSuggestions = suggestions.slice(0, 10);
    
    // 保存されているチェック状態を適用
    limitedSuggestions.forEach(suggestion => {
        if (suggestionStates[suggestion.id] !== undefined) {
            suggestion.checked = suggestionStates[suggestion.id];
        }
    });
    
    return {
        status,
        message,
        suggestions: limitedSuggestions
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

// 2つの通貨の組み合わせを探す関数（詳細版）
function findTwoCurrencyCombinations(targetAmount, suggestions, isExcess) {
    const mainCurrencies = [
        { value: 10000, name: '一万円札', unit: '枚', id: 'bill-10000' },
        { value: 5000, name: '五千円札', unit: '枚', id: 'bill-5000' },
        { value: 2000, name: '二千円札', unit: '枚', id: 'bill-2000' },
        { value: 1000, name: '千円札', unit: '枚', id: 'bill-1000' },
        { value: 500, name: '五百円玉', unit: '枚', id: 'coin-500' },
        { value: 100, name: '百円玉', unit: '枚', id: 'coin-100' },
        { value: 50, name: '五十円玉', unit: '枚', id: 'coin-50' },
        { value: 10, name: '十円玉', unit: '枚', id: 'coin-10' },
        { value: 5, name: '五円玉', unit: '枚', id: 'coin-5' },
        { value: 1, name: '一円玉', unit: '枚', id: 'coin-1' },
        { value: 25000, name: '五百円棒金', unit: '本', id: 'roll-500' },
        { value: 5000, name: '百円棒金', unit: '本', id: 'roll-100' },
        { value: 2500, name: '五十円棒金', unit: '本', id: 'roll-50' },
        { value: 500, name: '十円棒金', unit: '本', id: 'roll-10' },
        { value: 250, name: '五円棒金', unit: '本', id: 'roll-5' },
        { value: 50, name: '一円棒金', unit: '本', id: 'roll-1' }
    ];
    
    // 効率的な探索のため、より大きな金額から開始
    for (let i = 0; i < mainCurrencies.length; i++) {
        for (let j = i; j < mainCurrencies.length; j++) {
            const curr1 = mainCurrencies[i];
            const curr2 = mainCurrencies[j];
            
            // 計算効率を考慮した最大数制限
            const maxCount1 = Math.min(20, Math.ceil(targetAmount / curr1.value) + 5);
            const maxCount2 = Math.min(20, Math.ceil(targetAmount / curr2.value) + 5);
            
            for (let count1 = 1; count1 <= maxCount1; count1++) {
                for (let count2 = (i === j ? count1 : 1); count2 <= maxCount2; count2++) {
                    const totalValue = count1 * curr1.value + count2 * curr2.value;
                    
                    if (totalValue === targetAmount) {
                        const description = i === j 
                            ? `${curr1.name}が${count1 + count2}${curr1.unit}${isExcess ? '多い' : '少ない'}`
                            : `${curr1.name}${count1}${curr1.unit}と${curr2.name}${count2}${curr2.unit}が${isExcess ? '多い' : '少ない'}`;
                        
                        const detail = i === j
                            ? `${formatAmount(totalValue)} = ${curr1.name} × ${count1 + count2}${curr1.unit}`
                            : `${formatAmount(totalValue)} = ${curr1.name} × ${count1}${curr1.unit} + ${curr2.name} × ${count2}${curr2.unit}`;
                        
                        suggestions.push({
                            type: 'combination',
                            priority: 2,
                            description,
                            detail,
                            checked: false,
                            id: `combo2-${curr1.id}-${count1}-${curr2.id}-${count2}`
                        });
                        
                        if (suggestions.filter(s => s.type === 'combination').length >= 5) return;
                    }
                }
            }
        }
    }
}

// 3つの通貨の組み合わせを探す関数
function findThreeCurrencyCombinations(targetAmount, suggestions, isExcess) {
    const commonCurrencies = [
        { value: 10000, name: '一万円札', unit: '枚', id: 'bill-10000' },
        { value: 5000, name: '五千円札', unit: '枚', id: 'bill-5000' },
        { value: 1000, name: '千円札', unit: '枚', id: 'bill-1000' },
        { value: 500, name: '五百円玉', unit: '枚', id: 'coin-500' },
        { value: 100, name: '百円玉', unit: '枚', id: 'coin-100' },
        { value: 50, name: '五十円玉', unit: '枚', id: 'coin-50' },
        { value: 10, name: '十円玉', unit: '枚', id: 'coin-10' },
        { value: 1, name: '一円玉', unit: '枚', id: 'coin-1' }
    ];
    
    // 3つの通貨での組み合わせ（計算量を抑制）
    for (let i = 0; i < commonCurrencies.length - 2; i++) {
        for (let j = i + 1; j < commonCurrencies.length - 1; j++) {
            for (let k = j + 1; k < commonCurrencies.length; k++) {
                const curr1 = commonCurrencies[i];
                const curr2 = commonCurrencies[j];
                const curr3 = commonCurrencies[k];
                
                const maxCount = 10; // 3つの組み合わせは少ない数に制限
                
                for (let count1 = 1; count1 <= maxCount; count1++) {
                    for (let count2 = 1; count2 <= maxCount; count2++) {
                        for (let count3 = 1; count3 <= maxCount; count3++) {
                            const totalValue = count1 * curr1.value + count2 * curr2.value + count3 * curr3.value;
                            
                            if (totalValue === targetAmount) {
                                suggestions.push({
                                    type: 'complex',
                                    priority: 3,
                                    description: `${curr1.name}${count1}${curr1.unit}、${curr2.name}${count2}${curr2.unit}、${curr3.name}${count3}${curr3.unit}が${isExcess ? '多い' : '少ない'}`,
                                    detail: `${formatAmount(totalValue)} = ${curr1.name} × ${count1} + ${curr2.name} × ${count2} + ${curr3.name} × ${count3}`,
                                    checked: false,
                                    id: `combo3-${curr1.id}-${count1}-${curr2.id}-${count2}-${curr3.id}-${count3}`
                                });
                                
                                if (suggestions.filter(s => s.type === 'complex').length >= 2) return;
                            }
                        }
                    }
                }
            }
        }
    }
}

// 近似値での解を探す関数
function findApproximateSolutions(targetAmount, suggestions, isExcess) {
    const currencies = [
        { value: 10000, name: '一万円札', unit: '枚' },
        { value: 5000, name: '五千円札', unit: '枚' },
        { value: 1000, name: '千円札', unit: '枚' },
        { value: 500, name: '五百円玉', unit: '枚' },
        { value: 100, name: '百円玉', unit: '枚' },
        { value: 50, name: '五十円玉', unit: '枚' },
        { value: 10, name: '十円玉', unit: '枚' }
    ];
    
    currencies.forEach(currency => {
        const exactCount = targetAmount / currency.value;
        const roundedCount = Math.round(exactCount);
        
        if (roundedCount > 0 && roundedCount <= 30) {
            const approximateAmount = roundedCount * currency.value;
            const error = Math.abs(approximateAmount - targetAmount);
            const errorPercentage = (error / targetAmount) * 100;
            
            // 5%以内の誤差で、誤差が500円以下の場合のみ提案
            if (errorPercentage <= 5 && error <= 500 && error > 0) {
                suggestions.push({
                    type: 'approximate',
                    priority: 4,
                    description: `${currency.name}約${roundedCount}${currency.unit}の${isExcess ? '過多' : '不足'}（誤差±${formatAmount(error)}）`,
                    detail: `${formatAmount(approximateAmount)} ≈ ${formatAmount(targetAmount)} (誤差 ${errorPercentage.toFixed(1)}%)`,
                    checked: false,
                    id: `approx-${currency.value}-${roundedCount}`
                });
            }
        }
    });
}

// 棒金関連の解を探す関数
function findRollRelatedSolutions(targetAmount, suggestions, isExcess) {
    const rollCurrencies = [
        { value: 25000, name: '五百円棒金', baseValue: 500, baseUnit: '枚', unit: '本', count: 50 },
        { value: 5000, name: '百円棒金', baseValue: 100, baseUnit: '枚', unit: '本', count: 50 },
        { value: 2500, name: '五十円棒金', baseValue: 50, baseUnit: '枚', unit: '本', count: 50 },
        { value: 500, name: '十円棒金', baseValue: 10, baseUnit: '枚', unit: '本', count: 50 },
        { value: 250, name: '五円棒金', baseValue: 5, baseUnit: '枚', unit: '本', count: 50 },
        { value: 50, name: '一円棒金', baseValue: 1, baseUnit: '枚', unit: '本', count: 50 }
    ];
    
    rollCurrencies.forEach(roll => {
        // 棒金の過不足をチェック
        if (targetAmount % roll.value === 0) {
            const rollCount = targetAmount / roll.value;
            if (rollCount <= 10) {
                suggestions.push({
                    type: 'roll',
                    priority: 2,
                    description: `${roll.name}が${rollCount}${roll.unit}${isExcess ? '多い' : '少ない'}`,
                    detail: `${formatAmount(targetAmount)} = ${roll.name} × ${rollCount}${roll.unit} (${roll.baseValue}円硬貨 × ${rollCount * roll.count}${roll.baseUnit})`,
                    checked: false,
                    id: `roll-${roll.value}-${rollCount}`
                });
            }
        }
        
        // 棒金の一部（硬貨単位）での過不足をチェック
        if (targetAmount % roll.baseValue === 0) {
            const coinCount = targetAmount / roll.baseValue;
            if (coinCount <= roll.count && coinCount >= 5) { // 5枚以上、1棒金以下
                suggestions.push({
                    type: 'partial-roll',
                    priority: 3,
                    description: `${roll.baseValue}円硬貨が${coinCount}${roll.baseUnit}${isExcess ? '多い' : '少ない'}（${roll.name}の一部）`,
                    detail: `${formatAmount(targetAmount)} = ${roll.baseValue}円硬貨 × ${coinCount}${roll.baseUnit}`,
                    checked: false,
                    id: `partial-roll-${roll.baseValue}-${coinCount}`
                });
            }
        }
    });
}

// 計算実行関数
function performCalculation() {
    const total = calculateTotal();
    const expected = parseInt(expectedAmountInput.value) || 0;
    
    // 小計を更新
    calculateSubtotals();
    
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

// 提案の表示とソート機能（詳細版）
function displaySuggestions(suggestions) {
    // チェック状態でソート（チェック済みを下に）、その後優先度でソート
    const sortedSuggestions = [...suggestions].sort((a, b) => {
        if (a.checked && !b.checked) return 1;
        if (!a.checked && b.checked) return -1;
        
        // 優先度でソート
        if (a.priority !== b.priority) return a.priority - b.priority;
        return 0;
    });
    
    breakdownContent.innerHTML = '';
    
    if (sortedSuggestions.length === 0) {
        breakdownContent.innerHTML = '<div class="breakdown-item no-suggestions">明確な原因を特定できませんでした。<br>計数を再確認するか、複数の要因が重なっている可能性があります。</div>';
        return;
    }
    
    sortedSuggestions.forEach((suggestion, index) => {
        const item = document.createElement('div');
        item.className = `breakdown-item ${suggestion.type} ${suggestion.checked ? 'checked' : ''}`;
        item.setAttribute('data-id', suggestion.id);
        
        // 詳細情報の表示/非表示ボタン
        const detailToggle = suggestion.detail ? 
            `<button class="detail-toggle" onclick="toggleDetail('${suggestion.id}')">詳細</button>` : '';
        
        const itemHTML = `
            <div class="suggestion-header">
                <label class="suggestion-label">
                    <input type="checkbox" class="suggestion-checkbox" ${suggestion.checked ? 'checked' : ''}>
                    <span class="suggestion-text">
                        <span class="suggestion-description">${suggestion.description}</span>
                    </span>
                </label>
                ${detailToggle}
            </div>
            ${suggestion.detail ? `<div class="suggestion-detail" id="detail-${suggestion.id}" style="display: none;">${suggestion.detail}</div>` : ''}
        `;
        
        item.innerHTML = itemHTML;
        
        // チェックボックスイベント
        const checkbox = item.querySelector('.suggestion-checkbox');
        checkbox.addEventListener('change', () => handleCheckboxChange(suggestion.id, checkbox.checked));
        
        // ラベルクリックでチェックボックスをトグル
        const label = item.querySelector('.suggestion-label');
        label.addEventListener('click', (e) => {
            if (e.target !== checkbox && !e.target.classList.contains('detail-toggle')) {
                e.preventDefault();
                checkbox.checked = !checkbox.checked;
                handleCheckboxChange(suggestion.id, checkbox.checked);
            }
        });
        
        breakdownContent.appendChild(item);
    });
}

// 詳細表示の切り替え（グローバル関数）
window.toggleDetail = function(suggestionId) {
    const detailElement = document.getElementById(`detail-${suggestionId}`);
    const toggleButton = document.querySelector(`[data-id="${suggestionId}"] .detail-toggle`);
    
    if (detailElement && toggleButton) {
        if (detailElement.style.display === 'none') {
            detailElement.style.display = 'block';
            toggleButton.textContent = '閉じる';
        } else {
            detailElement.style.display = 'none';
            toggleButton.textContent = '詳細';
        }
    }
};

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
                // チェックボックスの状態を即座に更新
                const checkbox = document.querySelector(`[data-id="${suggestionId}"] .suggestion-checkbox`);
                checkbox.checked = true;
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
    // グローバル状態を更新
    suggestionStates[suggestionId] = isChecked;
}

// クリア関数
function clearAll() {
    currencies.forEach(currency => {
        document.getElementById(currency.id).value = '';
        // 個別小計もリセット
        const subtotalElement = document.getElementById(currency.id + '-subtotal');
        if (subtotalElement) {
            subtotalElement.textContent = '0円';
            subtotalElement.style.display = 'none';
        }
    });
    expectedAmountInput.value = '100000';
    totalAmountDisplay.textContent = '0円';
    
    // セクション小計をリセット
    billsSubtotal.textContent = '0円';
    rollsSubtotal.textContent = '0円';
    coinsSubtotal.textContent = '0円';
    
    differenceSection.style.display = 'none';
    breakdownSection.style.display = 'none';
    
    // チェック状態もリセット
    suggestionStates = {};
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
    startTimeUpdate(); // 時刻表示開始
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

// 現在時刻表示機能
function updateCurrentTime() {
    const timeElement = document.getElementById('current-time');
    if (timeElement) {
        const now = new Date();
        const timeString = now.toLocaleTimeString('ja-JP', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
        const dateString = now.toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
        
        timeElement.textContent = `${dateString} ${timeString}`;
    }
}

// 時刻を1秒ごとに更新
function startTimeUpdate() {
    updateCurrentTime(); // 初回表示
    setInterval(updateCurrentTime, 1000); // 1秒ごとに更新
}
