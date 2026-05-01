const TEMPLATE_WIDTH = 600;

// Substitute {{PLACEHOLDER}} tokens with sample data (pass {} to preserve all tokens)
const substitute = (text, sampleData) => {
  if (!text) return text;
  if (!sampleData || Object.keys(sampleData).length === 0) return text;
  return text.replace(/\{\{(\w+)\}\}/g, (match, key) =>
    sampleData[key] !== undefined ? sampleData[key] : match
  );
};

// Inline CSS for each element's wrapper <td>
const buildTdStyle = (el) => {
  const parts = [
    `padding:${el.padding ?? 15}px`,
    `font-size:${el.fontSize || 14}px`,
    `font-family:'Arial','Helvetica',sans-serif`,
    `color:${el.color || '#333333'}`,
    `text-align:${el.align || 'left'}`,
  ];
  if (el.lineHeight) parts.push(`line-height:${el.lineHeight}`);
  if (el.fontWeight) parts.push(`font-weight:${el.fontWeight}`);
  if (el.bgColor && el.type !== 'button') parts.push(`background-color:${el.bgColor}`);
  return parts.join(';') + ';';
};

// Build one element row
const buildRow = (el, sampleData) => {
  const td = buildTdStyle(el);
  const w = el.width ? ` width="${el.width}"` : ` width="${TEMPLATE_WIDTH}"`;

  switch (el.type) {
    case 'text':
      return `<tr>
  <td${w} style="${td}">
    <span style="display:block;">${substitute(el.content, sampleData) || '(Empty)'}</span>
  </td>
</tr>`;

    case 'heading': {
      const lvl = el.level || 'h2';
      const sz = { h1: '28px', h2: '24px', h3: '20px' }[lvl] || '24px';
      return `<tr>
  <td${w} style="${td}">
    <${lvl} style="margin:0;padding:0;font-size:${sz};color:${el.color || '#333333'};font-family:'Arial','Helvetica',sans-serif;font-weight:bold;">${substitute(el.content, sampleData) || 'Heading'}</${lvl}>
  </td>
</tr>`;
    }

    case 'chart':
      return `<tr>
  <td${w} style="${td}">
    {{${el.chartName || 'CHART_NAME'}}}
  </td>
</tr>`;

    case 'button': {
      const pad = el.buttonPadding ?? 10;
      const bg = el.bgColor || '#0066cc';
      const fg = el.buttonTextColor || '#ffffff';
      const href = el.url || '#';
      const label = substitute(el.text, sampleData) || 'Button';
      const btnWidth = (el.width || 160) - pad * 2;
      const btnHeight = (el.fontSize || 14) + pad * 2 + 8;
      // VML for Outlook 2007-2019; plain <a> for all others
      return `<tr>
  <td${w} style="${td}">
    <!--[if mso]>
    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word"
      href="${href}" style="height:${btnHeight}px;v-text-anchor:middle;width:${btnWidth}px;"
      arcsize="8%" stroke="f" fillcolor="${bg}">
      <w:anchorlock/>
      <center style="color:${fg};font-family:'Arial','Helvetica',sans-serif;font-size:${el.fontSize || 14}px;font-weight:bold;">${label}</center>
    </v:roundrect>
    <![endif]--><!--[if !mso]><!-->
    <table border="0" cellpadding="0" cellspacing="0" style="border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;">
      <tr>
        <td bgcolor="${bg}" style="border-radius:4px;padding:${pad}px ${pad * 2}px;background-color:${bg};">
          <a href="${href}" target="_blank" style="display:inline-block;color:${fg};text-decoration:none;font-weight:bold;font-family:'Arial','Helvetica',sans-serif;font-size:${el.fontSize || 14}px;mso-hide:all;">${label}</a>
        </td>
      </tr>
    </table>
    <!--<![endif]-->
  </td>
</tr>`;
    }

    case 'image': {
      const iw = el.imgWidth || el.width || 200;
      const ih = el.imgHeight && el.imgHeight !== 'auto' ? `height="${el.imgHeight}" ` : '';
      const ihStyle = el.imgHeight && el.imgHeight !== 'auto' ? `height:${el.imgHeight}px;` : '';
      const img = el.src
        ? `<img src="${el.src}" alt="${el.alt || ''}" width="${iw}" ${ih}style="display:block;border:0;outline:none;text-decoration:none;max-width:100%;width:${iw}px;${ihStyle}" />`
        : `<div style="background:#eee;width:${iw}px;height:80px;display:flex;align-items:center;justify-content:center;color:#999;font-size:12px;">[No image URL]</div>`;
      return `<tr>
  <td${w} style="${td}">
    ${img}
  </td>
</tr>`;
    }

    case 'spacer':
      return `<tr>
  <td height="${el.height || 20}" style="height:${el.height || 20}px;font-size:0;line-height:0;mso-line-height-rule:exactly;">&nbsp;</td>
</tr>`;

    default:
      return '';
  }
};

// Full standalone HTML with outer shell (for preview/export with sample data substituted)
export const generateOutlookHTML = (elements, sampleData = {}) => {
  const rows = elements.map((el) => buildRow(el, sampleData)).join('\n');
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="x-apple-disable-message-reformatting" />
  <!--[if !mso]><!-->
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <!--<![endif]-->
  <!--[if mso]>
  <xml><o:OfficeDocumentSettings><o:AllowPNG/><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml>
  <![endif]-->
  <title>Email Template</title>
</head>
<body style="margin:0;padding:0;word-spacing:normal;background-color:#f5f5f5;">
  <div style="display:none;font-size:1px;color:#f5f5f5;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
    Email from the reporting engine.
  </div>
  <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;background-color:#f5f5f5;">
    <tr>
      <td align="center" style="padding:20px 10px;">
        <table width="${TEMPLATE_WIDTH}" border="0" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;width:${TEMPLATE_WIDTH}px;background-color:#ffffff;">
          <tbody>
${rows}
          </tbody>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

// Inner-table-only HTML — for pasting into BigQuery email_list.html_template.
// Wraps rows in the standard outer shell but keeps ALL {{PLACEHOLDERS}} untouched.
export const generateTemplateHTML = (elements) => {
  return generateOutlookHTML(elements, {});
};

// Validation for export-time warnings
export const validateOutlookConstraints = (elements) => {
  const warnings = [];

  if (elements.length === 0) {
    warnings.push('Template is empty — add elements before exporting.');
    return warnings;
  }

  elements.forEach((el) => {
    if (el.type === 'chart' && !el.chartName)
      warnings.push(`Chart element has no placeholder name — it will export as {{CHART_NAME}}.`);
    if (el.type === 'button' && !el.url)
      warnings.push(`Button "${el.text || '(unnamed)'}" has no URL.`);
    if (el.type === 'image' && !el.src)
      warnings.push('An image element has no source URL.');
    if ((el.width || 150) > TEMPLATE_WIDTH)
      warnings.push(`Element "${el.type}" width ${el.width}px exceeds ${TEMPLATE_WIDTH}px limit.`);
  });

  return warnings;
};
