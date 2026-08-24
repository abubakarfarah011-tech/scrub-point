import { useState } from 'react';

export default function Footer() {
  return (
    <footer className="w-full text-slate-700 dark:text-slate-300 antialiased font-sans select-none pt-6 pb-8 border-t border-slate-200/80 dark:border-slate-800/80">
      <div className="max-w-7xl mx-auto px-2 flex flex-col sm:flex-row items-start sm:items-center justify-start gap-4">

        <div className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest shrink-0">
        📱 Connect With Scrub Point Live On:
        </div>
        <div className="flex flex-row items-center gap-2.5">
          <a
            href="https://www.tiktok.com/@scrubpoint_ltd?_r=1&_d=f0m6d3m1kl64d6&sec_uid=MS4wLjABAAAA7DnSBkbKv7fa-Gqx96xeIHp2ptj9L4hWaOpSFka6u3-EIeJ8AnUWiL8qApy2cxc6&share_author_id=7295118214219334661&sharer_language=en&source=h5_m&u_code=eak9iib874gie6&timestamp=1784212831&user_id=7295118214219334661&sec_user_id=MS4wLjABAAAA7DnSBkbKv7fa-Gqx96xeIHp2ptj9L4hWaOpSFka6u3-EIeJ8AnUWiL8qApy2cxc6&item_author_type=1&utm_source=whatsapp&utm_campaign=client_share&utm_medium=android&share_iid=7661152297498412808&share_link_id=ea7abe87-8eb1-4a36-ad1a-13e50925493e&share_app_id=1233&ugbiz_name=ACCOUNT&ug_btm=b8727%2Cb7360&social_share_type=5&enable_checksum=1"
            target="_blank"
            rel="noopener noreferrer"
            className="h-9 w-9 border-2 border-slate-900 bg-slate-950 text-white flex items-center justify-center rounded-xl transition-all duration-200 hover:scale-110 active:scale-95 shadow-xs focus:outline-none"
            title="Follow on TikTok"
          >
            <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
              <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.01 1.62 4.14.99 1.12 2.37 1.83 3.86 2.02v3.86c-1.76-.04-3.46-.69-4.81-1.83-.24-.2-.46-.42-.67-.65v6.52c-.08 2.21-.97 4.31-2.52 5.86-1.55 1.55-3.65 2.45-5.86 2.52-2.31.06-4.55-.83-6.14-2.45-1.59-1.63-2.43-3.88-2.31-6.19.11-2.18 1.05-4.22 2.61-5.71s3.68-2.3 5.86-2.22c.98.02 1.95.23 2.85.61V8.58c-1.39-.77-3.05-.88-4.53-.29-1.48.58-2.59 1.89-2.95 3.46-.37 1.57-.01 3.23.95 4.50s2.58 1.98 4.2 1.88c1.34-.05 2.61-.64 3.47-1.63.87-.99 1.28-2.31 1.15-3.62V.02z"/>
            </svg>
          </a>

          <a
            href="https://www.instagram.com/scrubpoint_ltd?igsh=MXJ1dHlxbzNtejh2cA=="
            target="_blank"
            rel="noopener noreferrer"
            className="h-9 w-9 bg-linear-to-tr from-amber-500 via-rose-500 to-purple-600 text-white flex items-center justify-center rounded-xl transition-all duration-200 hover:scale-110 active:scale-95 shadow-xs focus:outline-none"
            title="Follow on Instagram"
          >
            <svg className="h-4 w-4 fill-none stroke-current" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
            </svg>
          </a>

          <a
            href="https://www.facebook.com/share/191p5oUEHA/"
            target="_blank"
            rel="noopener noreferrer"
            className="h-9 w-9 border-2 border-[#1877F2] bg-[#1877F2] text-white flex items-center justify-center rounded-xl transition-all duration-200 hover:scale-110 active:scale-95 shadow-xs focus:outline-none"
            title="Follow on Facebook"
          >
            <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.313-4.669 1.207 0 2.466.217 2.466.217v2.71h-1.39c-1.49 0-1.85.923-1.85 1.871v2.242h3.055l-.488 3.47h-2.567v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
          </a>

        </div>
      </div>
    </footer>
  );
}
