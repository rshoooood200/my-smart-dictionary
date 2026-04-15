#!/usr/bin/env python3
"""
Vocabulary PDF Export using WeasyPrint with proper RTL Arabic support
Using Noto Sans Arabic font for proper Arabic text rendering
"""

import sys
import os
import json
from datetime import datetime

# Get the directory where this script is located
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
FONTS_DIR = os.path.join(os.path.dirname(SCRIPT_DIR), 'fonts')

def generate_html(data, export_type='all'):
    """Generate HTML content for PDF"""
    
    words = data.get('words', [])
    categories = data.get('categories', [])
    user_name = data.get('userName', 'المستخدم')
    selected_category = data.get('selectedCategory', None)
    
    # Labels
    level_labels = {
        'beginner': 'مبتدئ',
        'intermediate': 'متوسط',
        'advanced': 'متقدم'
    }
    pos_labels = {
        'noun': 'اسم', 'verb': 'فعل', 'adjective': 'صفة',
        'adverb': 'ظرف', 'preposition': 'حرف جر',
        'conjunction': 'حرف عطف', 'pronoun': 'ضمير', 'interjection': 'حرف تعجب'
    }
    
    # Font paths (absolute paths)
    font_regular = os.path.join(FONTS_DIR, 'NotoSansArabic-Regular.ttf')
    font_bold = os.path.join(FONTS_DIR, 'NotoSansArabic-Bold.ttf')
    
    # Build HTML with embedded font
    html = f'''<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <style>
        @font-face {{
            font-family: 'NotoArabic';
            src: url('file://{font_regular}') format('truetype');
            font-weight: normal;
        }}
        
        @font-face {{
            font-family: 'NotoArabic';
            src: url('file://{font_bold}') format('truetype');
            font-weight: bold;
        }}
        
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}
        
        body {{
            font-family: 'NotoArabic', 'Noto Sans Arabic', 'DejaVu Sans', sans-serif;
            direction: rtl;
            text-align: right;
            color: #333;
            font-size: 12pt;
            line-height: 1.8;
            padding: 20px;
        }}
        
        .cover-page {{
            text-align: center;
            padding: 100px 20px;
            page-break-after: always;
        }}
        
        .title {{
            font-size: 36pt;
            color: #10B981;
            font-weight: bold;
            margin-bottom: 20px;
        }}
        
        .subtitle {{
            font-size: 18pt;
            color: #666;
            margin-bottom: 40px;
        }}
        
        .info {{
            font-size: 14pt;
            color: #444;
            margin: 10px 0;
        }}
        
        .stats {{
            font-size: 12pt;
            color: #888;
            margin-top: 30px;
        }}
        
        .section {{
            margin: 20px 0;
        }}
        
        .section-header {{
            background: linear-gradient(135deg, #10B981, #059669);
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            margin-bottom: 15px;
            font-size: 16pt;
            font-weight: bold;
        }}
        
        .category-header {{
            padding: 12px 20px;
            border-radius: 8px;
            margin-bottom: 15px;
            color: white;
            font-size: 14pt;
            font-weight: bold;
        }}
        
        table {{
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
            font-size: 10pt;
        }}
        
        th {{
            background: #1F4E79;
            color: white;
            padding: 12px 8px;
            text-align: center;
            font-weight: bold;
        }}
        
        td {{
            padding: 10px 8px;
            text-align: center;
            border-bottom: 1px solid #E5E7EB;
        }}
        
        tr:nth-child(even) {{
            background: #F9FAFB;
        }}
        
        .word-col {{
            text-align: left;
            direction: ltr;
            font-family: 'Times New Roman', serif;
            font-size: 11pt;
        }}
        
        .footer {{
            text-align: center;
            margin-top: 50px;
            padding-top: 20px;
            border-top: 2px solid #E5E7EB;
            color: #888;
            font-size: 10pt;
        }}
        
        .signature {{
            color: #10B981;
            font-weight: bold;
            margin-top: 10px;
        }}
        
        @page {{
            size: A4;
            margin: 2cm;
        }}
        
        .page-break {{
            page-break-before: always;
        }}
    </style>
</head>
<body>
'''
    
    # Cover page
    html += f'''
    <div class="cover-page">
        <div class="title">قاموسي الذكي</div>
        <div class="subtitle">Vocabulary List</div>
        <div class="info">المستخدم: {user_name}</div>
        <div class="info">{datetime.now().strftime('%Y-%m-%d')}</div>
        <div class="stats">إجمالي الكلمات: {len(words)} | عدد التصنيفات: {len(categories)}</div>
    </div>
'''
    
    if export_type == 'all':
        html += '''
    <div class="section">
        <div class="section-header">جميع الكلمات (مرتبة أبجدياً)</div>
'''
        sorted_words = sorted(words, key=lambda w: w.get('word', '').lower())
        html += generate_word_table(sorted_words, pos_labels, level_labels)
        html += '    </div>'
    
    elif export_type == 'category' and selected_category:
        category = next((c for c in categories if c.get('id') == selected_category), None)
        if category:
            # التحقق من nameAr - تجاهل None كنص أو قيمة فارغة
            name_ar = category.get('nameAr')
            if name_ar and name_ar != 'None' and name_ar.strip():
                cat_name = name_ar
            else:
                cat_name = category.get('name', 'غير مصنف')
            cat_color = category.get('color', '#10B981')
            
            html += f'''
    <div class="section">
        <div class="category-header" style="background-color: {cat_color};">{cat_name}</div>
'''
            cat_words = [w for w in words if w.get('categoryId') == selected_category]
            cat_words = sorted(cat_words, key=lambda w: w.get('word', '').lower())
            html += generate_word_table(cat_words, pos_labels, level_labels)
            html += '    </div>'
    
    elif export_type == 'categories':
        for i, category in enumerate(categories):
            # التحقق من nameAr - تجاهل None كنص أو قيمة فارغة
            name_ar = category.get('nameAr')
            if name_ar and name_ar != 'None' and name_ar.strip():
                cat_name = name_ar
            else:
                cat_name = category.get('name', 'غير مصنف')
            cat_color = category.get('color', '#10B981')
            
            if i > 0:
                html += '<div class="page-break"></div>'
            
            html += f'''
    <div class="section">
        <div class="category-header" style="background-color: {cat_color};">{cat_name}</div>
'''
            cat_words = [w for w in words if w.get('categoryId') == category.get('id')]
            cat_words = sorted(cat_words, key=lambda w: w.get('word', '').lower())
            
            if cat_words:
                html += generate_word_table(cat_words, pos_labels, level_labels)
            else:
                html += '<p style="text-align: center; color: #888; padding: 20px;">لا توجد كلمات في هذا التصنيف</p>'
            
            html += '    </div>'
        
        # Uncategorized words
        uncategorized = [w for w in words if not w.get('categoryId') or 
                        w.get('categoryId') not in [c.get('id') for c in categories]]
        if uncategorized:
            html += '<div class="page-break"></div>'
            html += '''
    <div class="section">
        <div class="category-header" style="background-color: #6B7280;">غير مصنف</div>
'''
            uncategorized = sorted(uncategorized, key=lambda w: w.get('word', '').lower())
            html += generate_word_table(uncategorized, pos_labels, level_labels)
            html += '    </div>'
    
    # Footer
    html += '''
    <div class="footer">
        <div class="signature">صُمّم بواسطة رشيد الحربي</div>
        <div>My Smart Dictionary</div>
    </div>
</body>
</html>
'''
    
    return html

def generate_word_table(words, pos_labels, level_labels):
    """Generate HTML table for words"""
    if not words:
        return '<p style="text-align: center; color: #888; padding: 20px;">لا توجد كلمات</p>'
    
    html = '''
        <table>
            <thead>
                <tr>
                    <th>#</th>
                    <th>Word</th>
                    <th>الترجمة</th>
                    <th>النوع</th>
                    <th>المستوى</th>
                </tr>
            </thead>
            <tbody>
'''
    
    for i, word in enumerate(words, 1):
        translation = word.get('translation', '') or ''
        pos = word.get('partOfSpeech', '') or ''
        level = word.get('level', '') or ''
        
        # التحقق من قسم الكلام
        if pos and pos in pos_labels:
            pos_text = pos_labels[pos]
        elif pos:
            pos_text = pos
        else:
            pos_text = '-'
        
        # التحقق من المستوى
        if level and level in level_labels:
            level_text = level_labels[level]
        elif level:
            level_text = level
        else:
            level_text = '-'
        
        html += f'''
                <tr>
                    <td>{i}</td>
                    <td class="word-col">{word.get('word', '')}</td>
                    <td>{translation}</td>
                    <td>{pos_text}</td>
                    <td>{level_text}</td>
                </tr>
'''
    
    html += '''
            </tbody>
        </table>
'''
    
    return html

def main():
    if len(sys.argv) < 3:
        print("Usage: python export_vocabulary_html.py <input_json> <output_pdf> [export_type] [selected_category]")
        sys.exit(1)
    
    input_file = sys.argv[1]
    output_file = sys.argv[2]
    export_type = sys.argv[3] if len(sys.argv) > 3 else 'all'
    selected_category = sys.argv[4] if len(sys.argv) > 4 else None
    
    with open(input_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    if selected_category:
        data['selectedCategory'] = selected_category
    
    # Generate HTML
    html_content = generate_html(data, export_type)
    
    # Write HTML to temp file for debugging
    html_temp = input_file.replace('.json', '.html')
    with open(html_temp, 'w', encoding='utf-8') as f:
        f.write(html_content)
    
    # Use WeasyPrint to convert HTML to PDF
    try:
        from weasyprint import HTML, CSS
        from weasyprint.text.fonts import FontConfiguration
        
        font_config = FontConfiguration()
        
        html_doc = HTML(string=html_content, base_url=SCRIPT_DIR)
        html_doc.write_pdf(output_file, font_config=font_config)
        
        print(f"PDF generated successfully: {output_file}")
    except Exception as e:
        print(f"Error generating PDF: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == '__main__':
    main()
