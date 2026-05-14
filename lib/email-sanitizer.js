import sanitizeHtml from 'sanitize-html'

/**
 * Base sanitization configuration (shared between variants)
 */
const getBaseSanitizeConfig = () => ({
  allowedTags: [
    'a', 'p', 'div', 'span', 'br',
    'strong', 'em', 'b', 'i', 'u',
    'ul', 'ol', 'li', 'blockquote',
    'table', 'thead', 'tbody', 'tr', 'td', 'th',
    'pre', 'code', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'img',
  ],
  allowedAttributes: {
    a: ['href', 'target', 'rel', 'title', 'style'],
    img: ['src', 'alt', 'width', 'height', 'style'],
    table: ['width', 'height', 'cellpadding', 'cellspacing', 'border', 'align', 'bgcolor', 'style'],
    thead: ['align', 'valign', 'style'],
    tbody: ['align', 'valign', 'style'],
    tr: ['align', 'valign', 'bgcolor', 'style'],
    td: ['width', 'height', 'align', 'valign', 'bgcolor', 'colspan', 'rowspan', 'style'],
    th: ['width', 'height', 'align', 'valign', 'bgcolor', 'colspan', 'rowspan', 'style'],
    div: ['align', 'style'],
    p: ['align', 'style'],
    span: ['style'],
    '*': ['style'],
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  allowProtocolRelative: false,
  allowedStyles: {
    '*': {
      'color': [/^#[0-9a-fA-F]{3,6}$/, /^rgb/, /^rgba/, /^hsl/],
      'background-color': [/^#[0-9a-fA-F]{3,6}$/, /^rgb/, /^rgba/, /^hsl/],
      'font-size': [/^\d+(px|em|%|pt)$/],
      'font-family': [/^[\w\s,"'-]+$/],
      'font-style': [/^(normal|italic)$/],
      'font-weight': [/^\d+$/, /^bold$/, /^normal$/],
      'text-align': [/^(left|right|center|justify)$/],
      'text-decoration': [/^(none|underline|line-through|overline)$/],
      'margin': [/^\d+(px|em|%|pt)( \d+(px|em|%|pt))*$/],
      'margin-top': [/^\d+(px|em|%|pt)$/],
      'margin-right': [/^\d+(px|em|%|pt)$/],
      'margin-bottom': [/^\d+(px|em|%|pt)$/],
      'margin-left': [/^\d+(px|em|%|pt)$/],
      'padding': [/^\d+(px|em|%|pt)( \d+(px|em|%|pt))*$/],
      'padding-top': [/^\d+(px|em|%|pt)$/],
      'padding-right': [/^\d+(px|em|%|pt)$/],
      'padding-bottom': [/^\d+(px|em|%|pt)$/],
      'padding-left': [/^\d+(px|em|%|pt)$/],
      'border': [/^[\d\w\s#(),.%-]+$/],
      'border-color': [/^#[0-9a-fA-F]{3,6}$/, /^rgb/, /^rgba/, /^hsl/],
      'border-width': [/^\d+(px|em|%)$/],
      'border-style': [/^(none|solid|dashed|dotted|double)$/],
      'border-collapse': [/^(collapse|separate)$/],
      'border-spacing': [/^\d+(px|em|%)( \d+(px|em|%))?$/],
      'border-radius': [/^\d+(px|em|%)$/],
      'width': [/^\d+(px|em|%)$/, /^auto$/],
      'height': [/^\d+(px|em|%)$/, /^auto$/],
      'max-width': [/^\d+(px|em|%)$/, /^auto$/],
      'min-width': [/^\d+(px|em|%)$/],
      'line-height': [/^\d+(\.\d+)?(px|em|%)?$/],
      'vertical-align': [/^(top|middle|bottom|baseline)$/],
      'display': [/^(block|inline|inline-block|table|table-row|table-cell|none)$/],
      'float': [/^(left|right|none)$/],
      'white-space': [/^(normal|nowrap|pre|pre-wrap|pre-line)$/],
    },
  },
  transformTags: {
    a: (tagName, attribs) => {
      const href = attribs.href || ''

      // Block javascript: and data: URLs
      if (href.match(/^(javascript|data|vbscript):/i)) {
        return { tagName, attribs: {} }
      }

      // Only allow http, https, mailto
      if (!href.match(/^(https?|mailto):/i) && href !== '') {
        return { tagName, attribs: {} }
      }

      return {
        tagName,
        attribs: {
          ...attribs,
          target: '_blank',
          rel: 'noopener noreferrer nofollow',
        },
      }
    },
    img: (tagName, attribs) => {
      const src = attribs.src || ''

      // Block data: URLs
      if (src.match(/^data:/i)) {
        return { tagName: 'span', attribs: {} }
      }

      // Only allow http/https
      if (!src.match(/^https?:/i)) {
        return { tagName: 'span', attribs: {} }
      }

      return {
        tagName,
        attribs: {
          src: attribs.src,
          alt: attribs.alt || 'Image',
          width: attribs.width,
          height: attribs.height,
          loading: 'lazy',
        },
      }
    },
  },
  disallowedTagsMode: 'discard',
  nonBooleanAttributes: ['target', 'rel'],
})

/**
 * Generate both safe HTML variants from raw HTML
 * CRITICAL: Always sanitize from raw HTML, never re-sanitize sanitized HTML
 * 
 * @param {string} html - Raw HTML content from email
 * @returns {Object} - { safeHtmlNoImages, safeHtmlWithImages, hasImages }
 */
export function generateSafeEmailVariants(html) {
  if (!html) {
    return {
      safeHtmlNoImages: '',
      safeHtmlWithImages: '',
      hasImages: false,
    }
  }

  // Check if HTML contains images
  const hasImages = /<img[^>]+>/i.test(html)

  // Variant 1: Images BLOCKED (default)
  const configNoImages = getBaseSanitizeConfig()
  configNoImages.allowedTags = configNoImages.allowedTags.filter(tag => tag !== 'img')
  const safeHtmlNoImages = sanitizeHtml(html, configNoImages)

  // Variant 2: Images ALLOWED (after user clicks "Load images")
  const configWithImages = getBaseSanitizeConfig()
  const safeHtmlWithImages = sanitizeHtml(html, configWithImages)

  // Limit HTML size to prevent DoS (500KB max per variant)
  const truncateSafely = (htmlStr) => {
    if (htmlStr.length > 500000) {
      return htmlStr.substring(0, 500000) + '\n\n[Content truncated for safety]'
    }
    return htmlStr
  }

  return {
    safeHtmlNoImages: truncateSafely(safeHtmlNoImages),
    safeHtmlWithImages: truncateSafely(safeHtmlWithImages),
    hasImages,
  }
}

/**
 * Check if HTML contains images (kept for backward compatibility)
 * @param {string} html - HTML content
 * @returns {boolean}
 */
export function containsImages(html) {
  if (!html) return false
  return /<img[^>]+>/i.test(html)
}
