"use client"

import { motion } from "framer-motion"
import { Twitter, Github, Linkedin, Instagram, Youtube } from "lucide-react"

const footerLinks = {
  Product: [
    { label: "WaChat", href: "https://wachat.aryanshinde.in" },
    { label: "InvoiceGen", href: "https://invoicegen.aryanshinde.in" },
    { label: "Business Portflio", href: "https://business.aryanshinde.in" },
    { label: "SMRL", href: "https://smrl.aryanshinde.in" },
    { label: "Card Saver", href: "https://card-saver.aryanshinde.in" },
  ],
  Myself: [
    { label: "Portfolio", href: "https://aryanshinde.in" },
    { label: "My Projects", href: "https://projects.aryanshinde.in" },
    { label: "Agency", href: "https://devally.in" }
  ],
  Support: [
    { label: "Documentation (Soon)", href: "#" },
    { label: "API Reference (Soon)", href: "#" },
    { label: "Contact", href: "https://aryanshinde.in/contact" },
  ],
}

const socialLinks = [
  { icon: Instagram, href: "https://instagram.com/coder_aryu", label: "Instagram" },
  { icon: Github, href: "https://github.com/hetref", label: "GitHub" },
  { icon: Youtube, href: "https://www.youtube.com/@aryancodelab", label: "YouTube" },
  { icon: Linkedin, href: "https://www.linkedin.com/in/shindearyan", label: "LinkedIn" },
]

export function Footer() {
  return (
    <footer className="border-t border-border pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-6">
        {/* Footer Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-8 mb-12">
          {Object.entries(footerLinks).map(([category, links], i) => (
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <h4 className="text-[13px] uppercase tracking-[0.08em] text-foreground-dim font-medium mb-4">
                {category}
              </h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-muted text-sm hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-[var(--font-display)] text-lg font-bold text-foreground">
              Mel<span className="text-primary">Me</span>
            </span>
            <span className="text-muted text-sm">
              © {new Date().getFullYear()} MelMe. Open Source under MIT License.
            </span>
          </div>

          {/* Social Links */}
          <div className="flex items-center gap-4">
            {socialLinks.map((social) => (
              <a
                key={social.label}
                href={social.href}
                aria-label={social.label}
                className="text-muted hover:text-foreground transition-colors"
              >
                <social.icon size={20} />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
