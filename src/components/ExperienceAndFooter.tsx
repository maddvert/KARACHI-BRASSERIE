import { motion } from 'motion/react';
import { Clock, MapPin, Phone, ShoppingBag, Truck, Utensils, ExternalLink } from 'lucide-react';
import { RESTAURANT_COORDS } from '../data/karachiAreas';
import type { OrderType } from '../types/order';

export function WhatsAppIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M20.52 3.48A11.82 11.82 0 0 0 12.06 0C5.48 0 .12 5.36.12 11.94c0 2.1.55 4.15 1.6 5.96L0 24l6.26-1.64a11.9 11.9 0 0 0 5.8 1.48h.01c6.58 0 11.93-5.36 11.93-11.94 0-3.19-1.24-6.19-3.48-8.42ZM12.06 21.8h-.01a9.86 9.86 0 0 1-5.03-1.38l-.36-.21-3.71.97.99-3.62-.24-.37a9.86 9.86 0 0 1-1.52-5.25c0-5.44 4.43-9.87 9.88-9.87 2.64 0 5.12 1.03 6.98 2.9a9.82 9.82 0 0 1 2.9 6.97c0 5.44-4.43 9.86-9.88 9.86Zm5.42-7.39c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.75-1.64-2.05-.17-.3-.02-.46.13-.61.14-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.22 3.08c.15.2 2.1 3.21 5.09 4.5.71.31 1.27.49 1.7.63.72.23 1.37.2 1.88.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.35Z" />
    </svg>
  );
}

interface ExperienceAndFooterProps {
  isDark: boolean;
  onSelectOrderType: (type: OrderType) => void;
  onOpenMenu: () => void;
}

export function ExperienceAndFooter({
  isDark,
  onSelectOrderType,
  onOpenMenu,
}: ExperienceAndFooterProps) {
  const logoSrc = isDark
    ? '/assets/aistudio/logo-dark.webp'
    : '/assets/aistudio/logo-light.webp';

  const services = [
    {
      type: 'dine-in' as OrderType,
      title: 'All-Day Dine-In',
      desc: 'Relaxed bistro seating inside Hotel Excelsior, Opposite Atrium Mall, serving freshly plated meals from noon until midnight.',
      icon: Utensils,
      cta: 'Book Dine-In',
    },
    {
      type: 'takeaway' as OrderType,
      title: 'Express Takeaway',
      desc: 'Order online ahead of arrival and pick up freshly packed dishes directly from our Saddar counter with zero wait.',
      icon: ShoppingBag,
      cta: 'Start Takeaway',
    },
    {
      type: 'delivery' as OrderType,
      title: 'Karachi Home Delivery',
      desc: 'Doorstep delivery across Saddar, Clifton, DHA, PECHS, Gulshan, and all Karachi neighborhoods with Cash or Card on Delivery.',
      icon: Truck,
      cta: 'Order Delivery',
    },
  ];

  return (
    <>
      <div className="kb-chevron-strip" aria-hidden="true" />

      {/* Dining, Takeaway & Delivery Experience Section */}
      <section
        id="experience"
        className="border-t border-neutral-200 dark:border-white/10 bg-neutral-100 dark:bg-[#131315]"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 space-y-8">
          <div className="max-w-2xl space-y-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
              How We Serve You
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-neutral-950 dark:text-white">
              Dine-In, Takeaway & Doorstep Delivery
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
            {services.map((srv, idx) => {
              const Icon = srv.icon;
              return (
                <motion.div
                  key={srv.type}
                  initial={{ opacity: 0, y: 28, scale: 0.96 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true, amount: 0.18 }}
                  transition={{ duration: 0.65, delay: idx * 0.08, ease: [0.16, 1, 0.3, 1] }}
                  className="rounded-2xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#1B1B1E] p-6 flex flex-col justify-between space-y-5 shadow-xs"
                >
                  <div className="space-y-3">
                    <div className="w-11 h-11 rounded-xl bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 flex items-center justify-center shadow-sm">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-display text-2xl font-bold text-neutral-950 dark:text-white">
                      {srv.title}
                    </h3>
                    <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
                      {srv.desc}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onSelectOrderType(srv.type);
                      onOpenMenu();
                    }}
                    className="w-fit px-4 py-2 rounded-xl border border-neutral-300 dark:border-white/20 text-xs font-semibold text-neutral-950 dark:text-white hover:bg-neutral-950 hover:text-white dark:hover:bg-white dark:hover:text-neutral-950 transition-colors cursor-pointer"
                  >
                    {srv.cta}
                  </button>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Contact & Location Footer */}
      <footer
        id="contact"
        className="border-t border-neutral-200 dark:border-white/10 bg-neutral-200/70 dark:bg-[#09090A] pb-20 md:pb-8"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-5 space-y-3">
            <div className="flex items-center gap-4">
              <img
                src={logoSrc}
                alt="Karachi Brasserie"
                loading="lazy"
                decoding="async"
                className="w-16 h-16 object-contain shrink-0 mix-blend-multiply dark:mix-blend-normal"
                referrerPolicy="no-referrer"
              />
              <div>
                <h3 className="font-display text-2xl font-bold text-neutral-950 dark:text-white tracking-wider">
                  Karachi Brasserie
                </h3>
                <p className="text-xs text-neutral-600 dark:text-neutral-400">All Day Eatery</p>
              </div>
            </div>
            <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed max-w-sm">
              Freshly prepared burgers, artisanal pizzas, focaccia sandwiches, specialty coffee, and
              hand-crafted desserts in Saddar, Karachi.
            </p>
          </div>

          <div className="md:col-span-4 space-y-3 text-sm">
            <h4 className="font-semibold uppercase tracking-wider text-xs text-neutral-500 dark:text-neutral-400">
              Location & Hours
            </h4>
            <div className="flex items-start gap-2.5 text-neutral-700 dark:text-neutral-300">
              <MapPin className="w-4 h-4 text-neutral-950 dark:text-white shrink-0 mt-0.5" />
              <span>{RESTAURANT_COORDS.address}</span>
            </div>
            <div className="flex items-center gap-2.5 text-neutral-700 dark:text-neutral-300">
              <Clock className="w-4 h-4 text-neutral-950 dark:text-white shrink-0" />
              <span>{RESTAURANT_COORDS.timings}</span>
            </div>
            <a
              href={RESTAURANT_COORDS.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-950 dark:text-white hover:underline pt-1"
            >
              <span>Open in Google Maps</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="md:col-span-3 space-y-3 text-sm">
            <h4 className="font-semibold uppercase tracking-wider text-xs text-neutral-500 dark:text-neutral-400">
              Direct Orders & Enquiries
            </h4>
            <a
              href={`tel:${RESTAURANT_COORDS.phoneDisplay}`}
              className="flex items-center gap-2.5 text-neutral-700 dark:text-neutral-300 hover:text-neutral-950 dark:hover:text-white transition-colors"
            >
              <Phone className="w-4 h-4 text-neutral-950 dark:text-white shrink-0" />
              <span className="font-mono-num">{RESTAURANT_COORDS.phoneDisplay}</span>
            </a>

            <a
              href={`https://wa.me/${RESTAURANT_COORDS.whatsappE164}?text=${encodeURIComponent(
                'Hello Karachi Brasserie! I would like to place an order or inquire about a table.'
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1F9D55] hover:bg-[#198748] text-white text-xs font-semibold transition-colors shadow-sm"
            >
              <WhatsAppIcon className="w-4 h-4" />
              <span>Chat on WhatsApp</span>
            </a>
          </div>
        </div>

        <div className="border-t border-neutral-300/70 dark:border-white/10 py-4 px-4 text-center text-xs text-neutral-600 dark:text-neutral-400">
          © {new Date().getFullYear()} Karachi Brasserie. Hotel Excelsior, Saddar, Karachi.
        </div>
      </footer>
    </>
  );
}
