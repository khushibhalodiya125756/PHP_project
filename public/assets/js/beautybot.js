// BeautyBot - AI Skincare Assistant JavaScript

class BeautyBot {
  constructor() {
    this.isOpen = false;
    this.history = [];
    this.init();
  }

  init() {
    this.renderWidget();
    this.bindEvents();
  }

  renderWidget() {
    const html = `
      <!-- Floating BeautyBot Trigger -->
      <button id="beautybot-trigger" class="beautybot-btn fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full text-white bg-[#4a3f44] hover:bg-[#5a4f54] flex items-center justify-center text-xl cursor-pointer shadow-xl border border-white/40 hover:scale-105 transition-all">
        <i class="fas fa-sparkles text-[#e5c1b3]"></i>
        <span class="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white"></span>
      </button>

      <!-- Chat Drawer / Modal Window -->
      <div id="beautybot-window" class="fixed bottom-24 right-6 z-50 w-96 max-w-[calc(100vw-2rem)] h-[540px] bg-white/80 dark:bg-stone-900/90 backdrop-blur-2xl rounded-3xl flex flex-col shadow-2xl border border-white/60 dark:border-stone-800 transition-all duration-300 opacity-0 pointer-events-none scale-95 origin-bottom-right overflow-hidden">
        
        <!-- Header -->
        <div class="bg-[#4a3f44] p-4 text-white flex items-center justify-between border-b border-white/10">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-full bg-white/15 border border-white/20 flex items-center justify-center text-[#e5c1b3] text-sm">
              <i class="fas fa-robot"></i>
            </div>
            <div>
              <h3 class="font-bold text-xs uppercase tracking-widest text-white">BeautyBot AI</h3>
              <p class="text-[10px] text-[#e5c1b3] flex items-center gap-1.5 font-medium">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Personal Skincare Advisor
              </p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button id="beautybot-clear" title="Clear Chat" class="text-stone-300 hover:text-white p-1 text-xs transition-colors"><i class="fas fa-trash-alt"></i></button>
            <button id="beautybot-close" class="text-stone-300 hover:text-white p-1 text-base transition-colors"><i class="fas fa-times"></i></button>
          </div>
        </div>

        <!-- Messages Body -->
        <div id="beautybot-messages" class="flex-1 p-4 overflow-y-auto space-y-4 text-xs">
          <!-- Initial Welcome Message -->
          <div class="flex gap-2.5">
            <div class="w-7 h-7 rounded-full bg-[#f3e3dd] text-[#4a3f44] flex items-center justify-center text-xs shrink-0 mt-0.5 border border-white/60">
              <i class="fas fa-sparkles text-[10px]"></i>
            </div>
            <div class="bg-white/60 dark:bg-stone-800/60 backdrop-blur-sm p-3.5 rounded-2xl rounded-tl-xs max-w-[85%] text-[#4a3f44] dark:text-stone-200 leading-relaxed border border-white/50 dark:border-stone-700 shadow-xs">
              Hello! 👋 I'm <strong>BeautyBot</strong>. How can I assist your skincare routine today? Ask me about ingredients, oily or dry skin, or try a suggested topic below:
            </div>
          </div>

          <!-- Suggested Quick Topics -->
          <div id="beautybot-suggestions" class="flex flex-wrap gap-1.5 pl-9">
            <button class="suggest-btn text-[11px] bg-white/70 hover:bg-white text-[#4a3f44] dark:bg-stone-800/70 dark:text-stone-200 px-3 py-1.5 rounded-full transition-colors border border-white/60 dark:border-stone-700 shadow-xs">
              🧴 Best cleanser for oily skin?
            </button>
            <button class="suggest-btn text-[11px] bg-white/70 hover:bg-white text-[#4a3f44] dark:bg-stone-800/70 dark:text-stone-200 px-3 py-1.5 rounded-full transition-colors border border-white/60 dark:border-stone-700 shadow-xs">
              ✨ How to fade dark spots?
            </button>
            <button class="suggest-btn text-[11px] bg-white/70 hover:bg-white text-[#4a3f44] dark:bg-stone-800/70 dark:text-stone-200 px-3 py-1.5 rounded-full transition-colors border border-white/60 dark:border-stone-700 shadow-xs">
              ☀️ Mineral vs Chemical Sunscreen?
            </button>
          </div>
        </div>

        <!-- Input Footer -->
        <form id="beautybot-form" class="p-3 border-t border-white/40 dark:border-stone-800 bg-white/40 dark:bg-stone-900/40 backdrop-blur-md flex gap-2 items-center">
          <input type="text" id="beautybot-input" placeholder="Ask BeautyBot anything..." class="flex-1 bg-white/60 dark:bg-stone-800/60 border border-white/60 dark:border-stone-700 rounded-xl px-3.5 py-2 text-xs focus:ring-2 focus:ring-[#e5c1b3] outline-none text-[#2d2a2a] dark:text-white" required />
          <button type="submit" class="bg-[#4a3f44] hover:bg-[#5a4f54] text-white w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors shadow-xs">
            <i class="fas fa-paper-plane text-xs"></i>
          </button>
        </form>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', html);
  }

  bindEvents() {
    const trigger = document.getElementById('beautybot-trigger');
    const closeBtn = document.getElementById('beautybot-close');
    const clearBtn = document.getElementById('beautybot-clear');
    const form = document.getElementById('beautybot-form');
    const input = document.getElementById('beautybot-input');
    const messages = document.getElementById('beautybot-messages');

    trigger.addEventListener('click', () => this.toggle());
    closeBtn.addEventListener('click', () => this.toggle(false));

    clearBtn.addEventListener('click', () => {
      messages.innerHTML = `
        <div class="flex gap-2.5">
          <div class="w-7 h-7 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center text-xs shrink-0 mt-1">
            <i class="fas fa-sparkles"></i>
          </div>
          <div class="bg-stone-100 dark:bg-stone-800 p-3.5 rounded-2xl rounded-tl-xs max-w-[85%] text-stone-800 dark:text-stone-200">
            Chat history cleared! What skincare topic would you like to explore next?
          </div>
        </div>
      `;
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = input.value.trim();
      if (!text) return;
      input.value = '';
      this.sendUserMessage(text);
    });

    messages.addEventListener('click', (e) => {
      const suggest = e.target.closest('.suggest-btn');
      if (suggest) {
        const query = suggest.textContent.replace(/^[^\w]+/, '').trim();
        this.sendUserMessage(query);
      }
    });
  }

  toggle(force) {
    this.isOpen = force !== undefined ? force : !this.isOpen;
    const win = document.getElementById('beautybot-window');
    if (this.isOpen) {
      win.classList.remove('opacity-0', 'pointer-events-none', 'scale-95');
      win.classList.add('opacity-100', 'pointer-events-auto', 'scale-100');
      document.getElementById('beautybot-input').focus();
    } else {
      win.classList.add('opacity-0', 'pointer-events-none', 'scale-95');
      win.classList.remove('opacity-100', 'pointer-events-auto', 'scale-100');
    }
  }

  sendUserMessage(text) {
    const messages = document.getElementById('beautybot-messages');

    // Remove old suggestions
    const oldSug = document.getElementById('beautybot-suggestions');
    if (oldSug) oldSug.remove();

    // Render User Message
    const userHtml = `
      <div class="flex justify-end">
        <div class="bg-[#4a3f44] text-white p-3 rounded-2xl rounded-tr-xs max-w-[85%] shadow-xs text-xs">
          ${this.escapeHtml(text)}
        </div>
      </div>
    `;
    messages.insertAdjacentHTML('beforeend', userHtml);

    // Render Typing Indicator
    const typingId = 'typing-' + Date.now();
    const typingHtml = `
      <div id="${typingId}" class="flex gap-2.5">
        <div class="w-7 h-7 rounded-full bg-[#f3e3dd] text-[#4a3f44] flex items-center justify-center text-xs shrink-0 mt-0.5 border border-white/60">
          <i class="fas fa-robot text-[10px]"></i>
        </div>
        <div class="bg-white/60 dark:bg-stone-800/60 backdrop-blur-sm p-3 rounded-2xl rounded-tl-xs text-stone-500 text-xs flex items-center gap-1.5 border border-white/50 dark:border-stone-700">
          <span class="w-1.5 h-1.5 rounded-full bg-[#4a3f44] animate-bounce"></span>
          <span class="w-1.5 h-1.5 rounded-full bg-[#4a3f44] animate-bounce [animation-delay:0.2s]"></span>
          <span class="w-1.5 h-1.5 rounded-full bg-[#4a3f44] animate-bounce [animation-delay:0.4s]"></span>
        </div>
      </div>
    `;
    messages.insertAdjacentHTML('beforeend', typingHtml);
    messages.scrollTop = messages.scrollHeight;

    // Call API
    fetch('/api/chatbot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text })
    })
      .then(res => res.json())
      .then(data => {
        document.getElementById(typingId)?.remove();

        let botReply = data.reply || "I couldn't process that. Please try asking about our facial serums or creams!";
        let prodsHtml = '';

        if (data.recommended_products && data.recommended_products.length > 0) {
          prodsHtml = `
            <div class="mt-3 space-y-2">
              <p class="text-[10px] font-bold text-[#4a3f44] dark:text-[#e5c1b3] uppercase tracking-wider">Recommended Products:</p>
              ${data.recommended_products.map(p => `
                <div class="bg-white/70 dark:bg-stone-800/80 border border-white/60 dark:border-stone-700 p-2.5 rounded-xl flex items-center gap-2.5 shadow-xs">
                  <img src="${p.main_image}" class="w-10 h-10 rounded-lg object-cover" />
                  <div class="flex-1 min-w-0">
                    <h4 class="font-bold text-xs truncate text-[#4a3f44] dark:text-white">${p.name}</h4>
                    <p class="text-xs text-[#6d5f65] font-semibold">$${(p.discounted_price || p.original_price).toFixed(2)}</p>
                  </div>
                  <button onclick="window.glowApp.addToCart(${p.id})" class="bg-[#4a3f44] hover:bg-[#5a4f54] text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-lg shrink-0 transition-colors">
                    + Add
                  </button>
                </div>
              `).join('')}
            </div>
          `;
        }

        const replyHtml = `
          <div class="flex gap-2.5">
            <div class="w-7 h-7 rounded-full bg-[#f3e3dd] text-[#4a3f44] flex items-center justify-center text-xs shrink-0 mt-0.5 border border-white/60">
              <i class="fas fa-sparkles text-[10px]"></i>
            </div>
            <div class="bg-white/60 dark:bg-stone-800/60 backdrop-blur-sm p-3.5 rounded-2xl rounded-tl-xs max-w-[85%] text-[#4a3f44] dark:text-stone-200 leading-relaxed border border-white/50 dark:border-stone-700 shadow-xs">
              <div>${botReply}</div>
              ${prodsHtml}
            </div>
          </div>
        `;

        messages.insertAdjacentHTML('beforeend', replyHtml);
        messages.scrollTop = messages.scrollHeight;
      })
      .catch(err => {
        document.getElementById(typingId)?.remove();
        const errHtml = `
          <div class="flex gap-2.5">
            <div class="w-7 h-7 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center text-xs shrink-0 mt-1">
              <i class="fas fa-exclamation-triangle text-amber-500"></i>
            </div>
            <div class="bg-stone-100 dark:bg-stone-800 p-3 rounded-2xl rounded-tl-xs text-stone-800 dark:text-stone-200">
              I had a brief connection pause. Feel free to ask again or browse our shop!
            </div>
          </div>
        `;
        messages.insertAdjacentHTML('beforeend', errHtml);
        messages.scrollTop = messages.scrollHeight;
      });
  }

  escapeHtml(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
}

// Instantiate on load
document.addEventListener('DOMContentLoaded', () => {
  window.beautyBot = new BeautyBot();
});
