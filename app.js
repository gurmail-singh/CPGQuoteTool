// Data model loaded from master tab of "CPG Products" sheet
const cpgMasterProducts = [
  {
    category: "CYBER App",
    groupDesc: "Mobile Phone Protection",
    prodDesc: "Cyber App - Apple & Android Endpoint Protection",
    supplier: "Supplier A",
    code: "CA01",
    buyPrice: 5.00,
    sellPrice: 10.00,
    colK: "Functions: Mobile Phone Scan & Threat Detection",
    colL: "Capabilities: Proactive threat hunting, investigation, and incident response.",
    colM: "Customer Benefit: Stops infection and harmful software on employee devices."
  },
  {
    category: "CYBER App",
    groupDesc: "DNS Protection",
    prodDesc: "DNS Scanner - Per-Domain DMARC Protection",
    supplier: "Sendmarc",
    code: "CD08",
    buyPrice: 30.00,
    sellPrice: 58.00,
    colK: "Functions: DMARC monitoring and DNS traffic analysis",
    colL: "Capabilities: Prevents email impersonation and domain spoofing",
    colM: "Customer Benefit: Protects brand reputation and customer trust."
  },
  {
    category: "CYBER Assure",
    groupDesc: "Endpoint Security",
    prodDesc: "Microsoft Computers & Laptop Protection (EDR/XDR)",
    supplier: "Supplier B",
    code: "CD01",
    buyPrice: 4.00,
    sellPrice: 8.33,
    colK: "Functions: Next-Gen Anti-Virus, EDR, XDR",
    colL: "Capabilities: Real-time threat detection and automated response",
    colM: "Customer Benefit: Secures endpoint hardware against modern cyber threats."
  }
];

let currentPageIndex = 0;
let categories = [];
let pageDiscounts = {}; // Map of category -> discount percentage

document.addEventListener("DOMContentLoaded", () => {
  initApp();
});

function initApp() {
  // Extract unique product categories
  categories = [...new Set(cpgMasterProducts.map(p => p.category))];
  
  // Initialize page discount store
  categories.forEach(cat => pageDiscounts[cat] = 0);

  renderCategoryPages();
  updatePageVisibility();
}

// Render dynamic pages grouped by Category
function renderCategoryPages() {
  const container = document.getElementById("dynamic-category-pages");
  container.innerHTML = "";

  categories.forEach((catName, idx) => {
    const pageDiv = document.createElement("div");
    pageDiv.className = "form-page";
    pageDiv.id = `page-cat-${idx}`;

    const catProducts = cpgMasterProducts.filter(p => p.category === catName);

    let html = `<h2>${catName} Products</h2>`;
    html += `<table class="product-table">
      <thead>
        <tr>
          <th>Product / Helper Info</th>
          <th>Qty (Licenses)</th>
          <th>CPG Buy Price (Read-Only)</th>
          <th>CPG Sell Price (£)</th>
        </tr>
      </thead>
      <tbody>`;

    catProducts.forEach(prod => {
      // Concatenate Col K, L, M into tooltip caption
      const tooltipText = `${prod.colK} | ${prod.colL} | ${prod.colM}`;

      html += `
        <tr>
          <td>
            <span class="product-name-hover" title="${tooltipText}">
              ${prod.prodDesc} ℹ️
            </span>
          </td>
          <td>
            <input type="number" min="0" value="0" id="qty_${prod.code}" class="qty-input" data-code="${prod.code}">
          </td>
          <td>
            <input type="text" value="£${prod.buyPrice.toFixed(2)}" readonly class="readonly-price">
          </td>
          <td>
            <input type="number" step="0.01" value="${prod.sellPrice.toFixed(2)}" 
                   id="price_${prod.code}" 
                   data-orig-price="${prod.sellPrice}" 
                   onchange="validateCustomPrice(this)">
          </td>
        </tr>`;
    });

    html += `</tbody></table>`;

    // Page Level Discount Radio Buttons
    html += `
      <div class="discount-box">
        <p><strong>Page Discount (${catName}):</strong></p>
        <div class="radio-group">
          ${[0, 10, 20, 25, 30, 40, 50].map(val => `
            <label>
              <input type="radio" name="discount_${catName}" value="${val}" ${val === 0 ? 'checked' : ''} onclick="setPageDiscount('${catName}', ${val})"> 
              ${val}%
            </label>
          `).join('')}
        </div>
      </div>`;

    // Navigation Controls
    html += `
      <div class="nav-buttons">
        <button type="button" class="btn-prev" onclick="prevPage()">&larr; Back</button>
        <button type="button" class="btn-next" onclick="nextPage()">Next &rarr;</button>
      </div>`;

    pageDiv.innerHTML = html;
    container.appendChild(pageDiv);
  });
}

// Discount Validation Rules: Price cannot be discounted below 50% of original figure
function validateCustomPrice(input) {
  const origPrice = parseFloat(input.dataset.origPrice);
  const newPrice = parseFloat(input.value);

  const minAllowedPrice = origPrice * 0.5;

  if (newPrice < minAllowedPrice) {
    alert("Warning: You cannot give more than a 50% discount on the selling price.");
    input.value = origPrice.toFixed(2);
  }
}

function setPageDiscount(category, percentage) {
  pageDiscounts[category] = percentage;
}

// Page Navigation Logic
function getTotalPages() {
  return 1 + categories.length + 1; // Details page + Category pages + Summary page
}

function updatePageVisibility() {
  const pages = document.querySelectorAll(".form-page");
  pages.forEach((p, idx) => {
    p.classList.toggle("active-page", idx === currentPageIndex);
  });

  // Render summary when landing on the last page
  if (currentPageIndex === getTotalPages() - 1) {
    buildSummaryTable();
  }
}

function nextPage() {
  if (currentPageIndex < getTotalPages() - 1) {
    currentPageIndex++;
    updatePageVisibility();
  }
}

function prevPage() {
  if (currentPageIndex > 0) {
    currentPageIndex--;
    updatePageVisibility();
  }
}

// Summary Calculation and Display
function buildSummaryTable() {
  const summaryContainer = document.getElementById("summary-table-container");
  const globalDiscountContainer = document.getElementById("global-discount-container");
  
  const selectedItems = getSelectedProducts();
  
  // Check if any page discounts were selected
  const hasPageDiscounts = Object.values(pageDiscounts).some(d => d > 0);

  if (!hasPageDiscounts) {
    globalDiscountContainer.style.display = "block";
  } else {
    globalDiscountContainer.style.display = "none";
  }

  if (selectedItems.length === 0) {
    summaryContainer.innerHTML = "<p>No products selected. Please go back and enter quantities.</p>";
    return;
  }

  let subtotal = 0;
  let html = `
    <table class="summary-table">
      <thead>
        <tr>
          <th>Description</th>
          <th>Qty</th>
          <th>Unit Price (£)</th>
          <th>Discount</th>
          <th>Amount GBP</th>
        </tr>
      </thead>
      <tbody>`;

  selectedItems.forEach(item => {
    let effectiveDiscount = pageDiscounts[item.category] || 0;
    
    // Fallback to global discount if no page discounts exist
    if (!hasPageDiscounts) {
      const globalRadio = document.querySelector('input[name="global_discount"]:checked');
      if (globalRadio) effectiveDiscount = parseFloat(globalRadio.value);
    }

    const discountedUnitPrice = item.unitPrice * (1 - (effectiveDiscount / 100));
    const lineTotal = item.qty * discountedUnitPrice;
    subtotal += lineTotal;

    html += `
      <tr>
        <td>${item.description}</td>
        <td>${item.qty}</td>
        <td>£${item.unitPrice.toFixed(2)}</td>
        <td>${effectiveDiscount}%</td>
        <td>£${lineTotal.toFixed(2)}</td>
      </tr>`;
  });

  const vat = subtotal * 0.20;
  const total = subtotal + vat;

  html += `
      </tbody>
    </table>
    <div class="summary-totals">
      <p><strong>Subtotal:</strong> £${subtotal.toFixed(2)}</p>
      <p><strong>VAT (20%):</strong> £${vat.toFixed(2)}</p>
      <p><strong>TOTAL GBP:</strong> £${total.toFixed(2)}</p>
    </div>`;

  summaryContainer.innerHTML = html;
}

function applyGlobalDiscount(value) {
  buildSummaryTable();
}

function getSelectedProducts() {
  const selected = [];
  cpgMasterProducts.forEach(prod => {
    const qtyInput = document.getElementById(`qty_${prod.code}`);
    const priceInput = document.getElementById(`price_${prod.code}`);
    
    if (qtyInput && priceInput) {
      const qty = parseInt(qtyInput.value) || 0;
      const unitPrice = parseFloat(priceInput.value) || 0;

      if (qty > 0) {
        selected.push({
          code: prod.code,
          category: prod.category,
          description: prod.prodDesc,
          qty: qty,
          unitPrice: unitPrice
        });
      }
    }
  });
  return selected;
}

// PDF Generation and Layout Matcher
function generateQuoteHTML() {
  const companyName = document.getElementById("cust-company-name").value || "Client Name";
  const attention = document.getElementById("cust-attention").value || "";
  const addr1 = document.getElementById("cust-addr1").value || "";
  const addr2 = document.getElementById("cust-addr2").value || "";
  const city = document.getElementById("cust-city").value || "";
  const postcode = document.getElementById("cust-postcode").value || "";
  const quoteNo = document.getElementById("quote-number").value || "QU-1000";
  const quoteRef = document.getElementById("quote-ref").value || "";

  const selectedItems = getSelectedProducts();
  const hasPageDiscounts = Object.values(pageDiscounts).some(d => d > 0);
  const globalRadio = document.querySelector('input[name="global_discount"]:checked');
  const globalDiscount = (!hasPageDiscounts && globalRadio) ? parseFloat(globalRadio.value) : 0;

  let subtotal = 0;
  let rowsHtml = "";

  selectedItems.forEach(item => {
    let discount = pageDiscounts[item.category] || globalDiscount;
    let finalUnitPrice = item.unitPrice * (1 - (discount / 100));
    let amount = item.qty * finalUnitPrice;
    subtotal += amount;

    rowsHtml += `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.description}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${item.qty}.00</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">£${finalUnitPrice.toFixed(2)}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">20%</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">£${amount.toFixed(2)}</td>
      </tr>`;
  });

  const vat = subtotal * 0.20;
  const grandTotal = subtotal + vat;

  return `
    <div id="pdf-document" style="font-family: Arial, sans-serif; font-size: 12px; color: #333; padding: 20px;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
        <div>
          <h2 style="margin: 0; color: #111;">QUOTE</h2>
          <p style="margin: 5px 0;"><strong>${companyName}</strong></p>
          <p style="margin: 2px 0;">Attention: ${attention}</p>
          <p style="margin: 2px 0;">${addr1}</p>
          <p style="margin: 2px 0;">${addr2}</p>
          <p style="margin: 2px 0;">${city} ${postcode}</p>
        </div>
        <div style="text-align: right;">
          <h3 style="margin: 0; color: #0056b3;">Cyber Protection Group</h3>
          <p style="margin: 2px 0;">Date: 12 Jun 2025</p>
          <p style="margin: 2px 0;">Expiry: 26 Jun 2025</p>
          <p style="margin: 2px 0;"><strong>Quote Number:</strong> ${quoteNo}</p>
          <p style="margin: 2px 0;">${quoteRef}</p>
          <p style="margin: 2px 0;">VAT Number: 485894422</p>
        </div>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
        <thead>
          <tr style="background-color: #f2f2f2; text-align: left;">
            <th style="padding: 8px;">Description</th>
            <th style="padding: 8px; text-align: center;">Quantity</th>
            <th style="padding: 8px; text-align: right;">Unit Price</th>
            <th style="padding: 8px; text-align: center;">VAT</th>
            <th style="padding: 8px; text-align: right;">Amount GBP</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>

      <div style="margin-top: 30px; float: right; width: 300px;">
        <div style="display: flex; justify-content: space-between; padding: 4px 0;">
          <span>Subtotal</span>
          <span>£${subtotal.toFixed(2)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 4px 0;">
          <span>TOTAL VAT 20%</span>
          <span>£${vat.toFixed(2)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-top: 2px solid #333; font-weight: bold; font-size: 14px;">
          <span>TOTAL GBP</span>
          <span>£${grandTotal.toFixed(2)}</span>
        </div>
      </div>

      <div style="clear: both; margin-top: 50px; font-size: 10px; text-align: center; color: #777; border-top: 1px solid #ccc; padding-top: 10px;">
        Terms: Monthly in Advance | 12 Month rolling contract<br>
        Company Registration No: 15161917. Registered Office: 85 Great Portland Street, First Floor, London, W1W 7LT, United Kingdom.
      </div>
    </div>
  `;
}

function previewPDF() {
  const container = document.getElementById("pdf-preview-target");
  container.innerHTML = generateQuoteHTML();
  document.getElementById("pdf-modal").style.display = "block";
}

function closeModal() {
  document.getElementById("pdf-modal").style.display = "none";
}

function downloadPDF() {
  const companyName = document.getElementById("cust-company-name").value.trim() || "Customer";
  const quoteNo = document.getElementById("quote-number").value.trim() || "Quote";
  const fileName = `${companyName} ${quoteNo}.pdf`;

  const element = document.createElement("div");
  element.innerHTML = generateQuoteHTML();

  const opt = {
    margin:       10,
    filename:     fileName,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2 },
    jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  html2pdf().set(opt).from(element).save();
}
