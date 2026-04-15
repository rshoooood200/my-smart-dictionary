#!/usr/bin/env python3
"""
Vocabulary PDF Export Script with proper RTL Arabic support
Using reportlab with arabic_reshaper and proper text shaping
"""

import sys
import os
import json
from datetime import datetime

# Add user packages to path
sys.path.insert(0, '/home/z/.local/lib/python3.13/site-packages')

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, Flowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily

# Arabic text support
try:
    import arabic_reshaper
    HAS_ARABIC_SUPPORT = True
except ImportError:
    HAS_ARABIC_SUPPORT = False

def shape_arabic(text):
    """
    Shape Arabic text for proper display.
    This reshapes letters and reverses visual order for RTL display.
    """
    if not text or not HAS_ARABIC_SUPPORT:
        return text
    
    if not any('\u0600' <= c <= '\u06FF' for c in text):
        return text
    
    try:
        # Split into words
        words = text.split()
        
        # Process each word
        processed_words = []
        for word in words:
            if any('\u0600' <= c <= '\u06FF' for c in word):
                # Reshape the word to connect letters
                reshaped = arabic_reshaper.reshape(word)
                # Reverse for visual display in LTR context
                visual = reshaped[::-1]
                processed_words.append(visual)
            else:
                processed_words.append(word)
        
        # Reverse word order for RTL reading
        processed_words = processed_words[::-1]
        
        return ' '.join(processed_words)
    except:
        return text


# Register fonts
pdfmetrics.registerFont(TTFont('DejaVuSans', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'))
pdfmetrics.registerFont(TTFont('DejaVuSans-Bold', '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'))
pdfmetrics.registerFont(TTFont('TimesNewRoman', '/usr/share/fonts/truetype/english/Times-New-Roman.ttf'))
registerFontFamily('DejaVuSans', normal='DejaVuSans', bold='DejaVuSans-Bold')

# Color scheme
PRIMARY_COLOR = colors.HexColor('#10B981')
HEADER_BG = colors.HexColor('#1F4E79')
TEXT_COLOR = colors.HexColor('#333333')
LIGHT_GRAY = colors.HexColor('#F5F5F5')


def create_styles():
    """Create paragraph styles"""
    styles = getSampleStyleSheet()
    
    styles.add(ParagraphStyle(
        name='ArabicTitle',
        fontName='DejaVuSans-Bold',
        fontSize=28,
        leading=36,
        alignment=TA_CENTER,
        textColor=PRIMARY_COLOR,
        spaceAfter=20
    ))
    
    styles.add(ParagraphStyle(
        name='ArabicSubtitle',
        fontName='DejaVuSans',
        fontSize=18,
        leading=24,
        alignment=TA_CENTER,
        textColor=colors.gray,
        spaceAfter=30
    ))
    
    styles.add(ParagraphStyle(
        name='Info',
        fontName='DejaVuSans',
        fontSize=14,
        leading=20,
        alignment=TA_CENTER,
        textColor=TEXT_COLOR,
        spaceAfter=10
    ))
    
    styles.add(ParagraphStyle(
        name='Stats',
        fontName='DejaVuSans',
        fontSize=11,
        leading=16,
        alignment=TA_CENTER,
        textColor=colors.gray,
        spaceAfter=20
    ))
    
    styles.add(ParagraphStyle(
        name='SectionHeader',
        fontName='DejaVuSans-Bold',
        fontSize=16,
        leading=24,
        alignment=TA_CENTER,
        textColor=colors.white,
        spaceBefore=20,
        spaceAfter=10
    ))
    
    styles.add(ParagraphStyle(
        name='TableCell',
        fontName='DejaVuSans',
        fontSize=9,
        leading=12,
        alignment=TA_CENTER,
        textColor=TEXT_COLOR
    ))
    
    styles.add(ParagraphStyle(
        name='TableCellEng',
        fontName='TimesNewRoman',
        fontSize=9,
        leading=12,
        alignment=TA_LEFT,
        textColor=TEXT_COLOR
    ))
    
    styles.add(ParagraphStyle(
        name='FooterText',
        fontName='DejaVuSans',
        fontSize=9,
        leading=12,
        alignment=TA_CENTER,
        textColor=colors.gray,
        spaceBefore=30
    ))
    
    return styles


def hex_to_rgb(hex_color):
    """Convert hex to RGB"""
    hex_color = hex_color.lstrip('#')
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))


def create_word_table(words, styles, pos_labels, level_labels):
    """Create word table"""
    if not words:
        return None
    
    # Header row
    header_data = [
        Paragraph('<b>#</b>', styles['TableCell']),
        Paragraph('<b>Word</b>', styles['TableCell']),
        Paragraph('<b>' + shape_arabic('الترجمة') + '</b>', styles['TableCell']),
        Paragraph('<b>' + shape_arabic('النوع') + '</b>', styles['TableCell']),
        Paragraph('<b>' + shape_arabic('المستوى') + '</b>', styles['TableCell']),
    ]
    
    data = [header_data]
    
    for i, word in enumerate(words, 1):
        translation = shape_arabic(word.get('translation', ''))
        pos = word.get('partOfSpeech', '')
        level = word.get('level', '')
        
        pos_text = shape_arabic(pos_labels.get(pos, '-')) if pos in pos_labels else '-'
        level_text = shape_arabic(level_labels.get(level, '-')) if level in level_labels else '-'
        
        row = [
            Paragraph(str(i), styles['TableCell']),
            Paragraph(word.get('word', ''), styles['TableCellEng']),
            Paragraph(translation, styles['TableCell']),
            Paragraph(pos_text, styles['TableCell']),
            Paragraph(level_text, styles['TableCell']),
        ]
        data.append(row)
    
    col_widths = [0.8*cm, 3.2*cm, 4.2*cm, 2.3*cm, 2*cm]
    table = Table(data, colWidths=col_widths)
    
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), HEADER_BG),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('FONTNAME', (0, 0), (-1, 0), 'DejaVuSans-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
        ('TOPPADDING', (0, 0), (-1, 0), 8),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 6),
        ('TOPPADDING', (0, 1), (-1, -1), 6),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E5E7EB')),
        ('LINEBELOW', (0, 0), (-1, 0), 1.5, HEADER_BG),
    ]))
    
    for i in range(1, len(data)):
        if i % 2 == 0:
            table.setStyle(TableStyle([('BACKGROUND', (0, i), (-1, i), LIGHT_GRAY)]))
    
    return table


def generate_pdf(data, output_path, export_type='all'):
    """Generate vocabulary PDF"""
    
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
    
    styles = create_styles()
    story = []
    
    # Cover page
    story.append(Spacer(1, 3*cm))
    story.append(Paragraph(shape_arabic('قاموسي الذكي'), styles['ArabicTitle']))
    story.append(Paragraph('Vocabulary List', styles['ArabicSubtitle']))
    story.append(Spacer(1, 1*cm))
    story.append(Paragraph(shape_arabic('المستخدم:') + ' ' + shape_arabic(user_name), styles['Info']))
    story.append(Paragraph(datetime.now().strftime('%Y-%m-%d'), styles['Info']))
    story.append(Spacer(1, 2*cm))
    story.append(Paragraph(
        shape_arabic('إجمالي الكلمات:') + f' {len(words)} | ' + shape_arabic('عدد التصنيفات:') + f' {len(categories)}',
        styles['Stats']
    ))
    story.append(PageBreak())
    
    if export_type == 'all':
        story.append(Paragraph('<b>All Words (A-Z)</b>', styles['SectionHeader']))
        story.append(Paragraph(shape_arabic('جميع الكلمات مرتبة أبجدياً'), styles['ArabicSubtitle']))
        story.append(Spacer(1, 0.5*cm))
        
        sorted_words = sorted(words, key=lambda w: w.get('word', '').lower())
        table = create_word_table(sorted_words, styles, pos_labels, level_labels)
        if table:
            story.append(table)
    
    elif export_type == 'category' and selected_category:
        category = next((c for c in categories if c.get('id') == selected_category), None)
        if category:
            cat_name = category.get('nameAr', category.get('name', 'غير مصنف'))
            cat_color = category.get('color', '#10B981')
            r, g, b = hex_to_rgb(cat_color)
            
            story.append(Paragraph('<b>' + shape_arabic(cat_name) + '</b>', styles['SectionHeader']))
            story.append(Spacer(1, 0.5*cm))
            
            cat_words = [w for w in words if w.get('categoryId') == selected_category]
            cat_words = sorted(cat_words, key=lambda w: w.get('word', '').lower())
            
            table = create_word_table(cat_words, styles, pos_labels, level_labels)
            if table:
                story.append(table)
            else:
                story.append(Paragraph(shape_arabic('لا توجد كلمات في هذا التصنيف'), styles['ArabicSubtitle']))
    
    elif export_type == 'categories':
        for category in categories:
            cat_name = category.get('nameAr', category.get('name', 'غير مصنف'))
            cat_color = category.get('color', '#10B981')
            r, g, b = hex_to_rgb(cat_color)
            
            # Category header with color
            header_table = Table(
                [[Paragraph('<b>' + shape_arabic(cat_name) + '</b>', styles['SectionHeader'])]],
                colWidths=[13*cm]
            )
            header_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, -1), colors.Color(r/255, g/255, b/255)),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('TOPPADDING', (0, 0), (-1, -1), 10),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
            ]))
            story.append(header_table)
            story.append(Spacer(1, 0.5*cm))
            
            cat_words = [w for w in words if w.get('categoryId') == category.get('id')]
            cat_words = sorted(cat_words, key=lambda w: w.get('word', '').lower())
            
            if cat_words:
                table = create_word_table(cat_words, styles, pos_labels, level_labels)
                if table:
                    story.append(table)
            else:
                story.append(Paragraph(shape_arabic('لا توجد كلمات'), styles['ArabicSubtitle']))
            
            story.append(Spacer(1, 1*cm))
        
        # Uncategorized
        uncategorized = [w for w in words if not w.get('categoryId') or 
                        w.get('categoryId') not in [c.get('id') for c in categories]]
        if uncategorized:
            header_table = Table(
                [[Paragraph('<b>' + shape_arabic('غير مصنف') + '</b>', styles['SectionHeader'])]],
                colWidths=[13*cm]
            )
            header_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, -1), colors.gray),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('TOPPADDING', (0, 0), (-1, -1), 10),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
            ]))
            story.append(header_table)
            story.append(Spacer(1, 0.5*cm))
            
            uncategorized = sorted(uncategorized, key=lambda w: w.get('word', '').lower())
            table = create_word_table(uncategorized, styles, pos_labels, level_labels)
            if table:
                story.append(table)
    
    # Footer
    story.append(Spacer(1, 2*cm))
    story.append(Paragraph('---', styles['FooterText']))
    story.append(Paragraph(shape_arabic('صُمّم بواسطة رشيد الحربي'), styles['FooterText']))
    story.append(Paragraph('My Smart Dictionary', styles['FooterText']))
    
    # Build PDF
    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        rightMargin=1.5*cm,
        leftMargin=1.5*cm,
        topMargin=2*cm,
        bottomMargin=2*cm,
        title='Vocabulary List',
        author='Z.ai',
        creator='Z.ai',
        subject='Vocabulary words export'
    )
    
    doc.build(story)
    print(f"PDF generated successfully: {output_path}")


def main():
    if len(sys.argv) < 3:
        print("Usage: python export_vocabulary_pdf.py <input_json> <output_pdf> [export_type] [selected_category]")
        sys.exit(1)
    
    input_file = sys.argv[1]
    output_file = sys.argv[2]
    export_type = sys.argv[3] if len(sys.argv) > 3 else 'all'
    selected_category = sys.argv[4] if len(sys.argv) > 4 else None
    
    with open(input_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    if selected_category:
        data['selectedCategory'] = selected_category
    
    generate_pdf(data, output_file, export_type)

if __name__ == '__main__':
    main()
