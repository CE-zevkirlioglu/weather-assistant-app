#!/usr/bin/env python3
"""
Profesyonel Hava Durumu İkonu Oluşturucu
Modern, minimal tasarım ile gradient arka plan ve hava durumu sembolleri
"""

from PIL import Image, ImageDraw, ImageFont
import math
import os

def create_gradient_background(size, colors):
    """Gradient arka plan oluştur"""
    img = Image.new('RGB', size, colors[0])
    draw = ImageDraw.Draw(img)
    
    for y in range(size[1]):
        ratio = y / size[1]
        r = int(colors[0][0] * (1 - ratio) + colors[1][0] * ratio)
        g = int(colors[0][1] * (1 - ratio) + colors[1][1] * ratio)
        b = int(colors[0][2] * (1 - ratio) + colors[1][2] * ratio)
        draw.line([(0, y), (size[0], y)], fill=(r, g, b))
    
    return img

def draw_cloud(draw, center_x, center_y, size, color):
    """Modern bulut çiz"""
    # Ana bulut gövdesi
    draw.ellipse([center_x - size*0.6, center_y - size*0.3, 
                  center_x + size*0.6, center_y + size*0.3], fill=color)
    
    # Sol bulut parçası
    draw.ellipse([center_x - size*0.9, center_y - size*0.1, 
                  center_x - size*0.3, center_y + size*0.4], fill=color)
    
    # Sağ bulut parçası
    draw.ellipse([center_x + size*0.3, center_y - size*0.1, 
                  center_x + size*0.9, center_y + size*0.4], fill=color)
    
    # Üst bulut parçası
    draw.ellipse([center_x - size*0.5, center_y - size*0.6, 
                  center_x + size*0.5, center_y - size*0.1], fill=color)

def draw_sun(draw, center_x, center_y, size, color):
    """Güneş çiz"""
    # Güneş çemberi
    radius = size * 0.25
    draw.ellipse([center_x - radius, center_y - radius, 
                  center_x + radius, center_y + radius], fill=color)
    
    # Güneş ışınları
    ray_length = size * 0.15
    ray_width = size * 0.03
    num_rays = 8
    
    for i in range(num_rays):
        angle = (2 * math.pi * i) / num_rays
        start_x = center_x + (radius + ray_width) * math.cos(angle)
        start_y = center_y + (radius + ray_width) * math.sin(angle)
        end_x = center_x + (radius + ray_length) * math.cos(angle)
        end_y = center_y + (radius + ray_length) * math.sin(angle)
        
        # Işın çizgisi
        draw.line([(start_x, start_y), (end_x, end_y)], fill=color, width=int(ray_width*2))

def draw_thermometer(draw, center_x, center_y, size, color):
    """Termometre çiz"""
    # Termometre gövdesi
    body_width = size * 0.08
    body_height = size * 0.5
    body_x = center_x - body_width / 2
    body_y = center_y - body_height / 2
    
    # Yuvarlak alt kısım
    bottom_radius = size * 0.12
    draw.ellipse([center_x - bottom_radius, center_y + body_height/2 - bottom_radius,
                  center_x + bottom_radius, center_y + body_height/2 + bottom_radius], 
                 fill=color)
    
    # Dikdörtgen gövde
    draw.rectangle([body_x, body_y, body_x + body_width, body_y + body_height], fill=color)
    
    # Üst kısım yuvarlak
    top_radius = body_width / 2
    draw.ellipse([body_x, body_y - top_radius, body_x + body_width, body_y + top_radius], 
                 fill=color)
    
    # İç sıcaklık göstergesi (kırmızı)
    inner_width = body_width * 0.5
    inner_height = body_height * 0.6
    inner_x = center_x - inner_width / 2
    inner_y = center_y + body_height/2 - inner_height - bottom_radius * 0.3
    draw.rectangle([inner_x, inner_y, inner_x + inner_width, inner_y + inner_height], 
                   fill=(255, 80, 80))

def create_app_icon():
    """Ana uygulama ikonu oluştur (1024x1024)"""
    size = 1024
    padding = size * 0.15  # Kenar boşluğu
    
    # Gradient renkler (mor-mavi tema)
    gradient_colors = [(102, 126, 234), (118, 75, 162)]  # #667eea, #764ba2
    
    # Gradient arka plan
    img = create_gradient_background((size, size), gradient_colors)
    draw = ImageDraw.Draw(img)
    
    # Merkez noktası
    center_x, center_y = size / 2, size / 2
    
    # İkon boyutu (padding içinde)
    icon_size = size - (padding * 2)
    
    # Bulut çiz (beyaz, %70 opacity)
    cloud_color = (255, 255, 255, 230)
    cloud_img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    cloud_draw = ImageDraw.Draw(cloud_img)
    draw_cloud(cloud_draw, center_x, center_y - icon_size*0.15, icon_size*0.5, cloud_color)
    img = Image.alpha_composite(img.convert('RGBA'), cloud_img).convert('RGB')
    draw = ImageDraw.Draw(img)
    
    # Güneş çiz (sarı-altın)
    sun_color = (255, 215, 0)
    draw_sun(draw, center_x - icon_size*0.2, center_y - icon_size*0.25, icon_size*0.4, sun_color)
    
    # Termometre çiz (beyaz)
    thermometer_color = (255, 255, 255)
    draw_thermometer(draw, center_x + icon_size*0.25, center_y + icon_size*0.1, icon_size*0.35, thermometer_color)
    
    return img

def create_android_foreground():
    """Android adaptive icon foreground (1024x1024)"""
    size = 1024
    padding = size * 0.2  # Daha fazla padding (Android adaptive icon için)
    
    # Gradient renkler
    gradient_colors = [(102, 126, 234), (118, 75, 162)]
    
    # Şeffaf arka plan (Android adaptive icon foreground şeffaf olmalı)
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Merkez noktası
    center_x, center_y = size / 2, size / 2
    icon_size = size - (padding * 2)
    
    # Bulut çiz
    cloud_color = (255, 255, 255, 255)
    cloud_img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    cloud_draw = ImageDraw.Draw(cloud_img)
    draw_cloud(cloud_draw, center_x, center_y - icon_size*0.15, icon_size*0.5, cloud_color)
    img = Image.alpha_composite(img, cloud_img)
    draw = ImageDraw.Draw(img)
    
    # Güneş çiz
    sun_color = (255, 215, 0, 255)
    draw_sun(draw, center_x - icon_size*0.2, center_y - icon_size*0.25, icon_size*0.4, sun_color)
    
    # Termometre çiz
    thermometer_color = (255, 255, 255, 255)
    draw_thermometer(draw, center_x + icon_size*0.25, center_y + icon_size*0.1, icon_size*0.35, thermometer_color)
    
    return img

def create_android_background():
    """Android adaptive icon background (1024x1024)"""
    size = 1024
    gradient_colors = [(102, 126, 234), (118, 75, 162)]
    img = create_gradient_background((size, size), gradient_colors)
    return img

def create_android_monochrome():
    """Android monochrome icon (1024x1024)"""
    size = 1024
    padding = size * 0.2
    
    # Beyaz arka plan
    img = Image.new('RGB', (size, size), (255, 255, 255))
    draw = ImageDraw.Draw(img)
    
    center_x, center_y = size / 2, size / 2
    icon_size = size - (padding * 2)
    
    # Siyah ikonlar
    cloud_color = (0, 0, 0)
    sun_color = (0, 0, 0)
    thermometer_color = (0, 0, 0)
    
    # Bulut
    draw_cloud(draw, center_x, center_y - icon_size*0.15, icon_size*0.5, cloud_color)
    
    # Güneş
    draw_sun(draw, center_x - icon_size*0.2, center_y - icon_size*0.25, icon_size*0.4, sun_color)
    
    # Termometre
    draw_thermometer(draw, center_x + icon_size*0.25, center_y + icon_size*0.1, icon_size*0.35, thermometer_color)
    
    return img

def create_splash_icon():
    """Splash screen ikonu (200px genişlik, yükseklik orantılı)"""
    width = 200
    height = 200
    
    # Gradient arka plan
    gradient_colors = [(102, 126, 234), (118, 75, 162)]
    img = create_gradient_background((width, height), gradient_colors)
    draw = ImageDraw.Draw(img)
    
    center_x, center_y = width / 2, height / 2
    icon_size = width * 0.7
    
    # Bulut
    cloud_color = (255, 255, 255, 230)
    cloud_img = Image.new('RGBA', (width, height), (0, 0, 0, 0))
    cloud_draw = ImageDraw.Draw(cloud_img)
    draw_cloud(cloud_draw, center_x, center_y - icon_size*0.15, icon_size*0.5, cloud_color)
    img = Image.alpha_composite(img.convert('RGBA'), cloud_img).convert('RGB')
    draw = ImageDraw.Draw(img)
    
    # Güneş
    sun_color = (255, 215, 0)
    draw_sun(draw, center_x - icon_size*0.2, center_y - icon_size*0.25, icon_size*0.4, sun_color)
    
    # Termometre
    thermometer_color = (255, 255, 255)
    draw_thermometer(draw, center_x + icon_size*0.25, center_y + icon_size*0.1, icon_size*0.35, thermometer_color)
    
    return img

def create_favicon():
    """Favicon (32x32)"""
    size = 32
    
    # Gradient arka plan
    gradient_colors = [(102, 126, 234), (118, 75, 162)]
    img = create_gradient_background((size, size), gradient_colors)
    draw = ImageDraw.Draw(img)
    
    center_x, center_y = size / 2, size / 2
    icon_size = size * 0.7
    
    # Basitleştirilmiş bulut (küçük boyut için)
    cloud_color = (255, 255, 255)
    draw.ellipse([center_x - icon_size*0.3, center_y - icon_size*0.15, 
                  center_x + icon_size*0.3, center_y + icon_size*0.15], fill=cloud_color)
    draw.ellipse([center_x - icon_size*0.45, center_y, 
                  center_x - icon_size*0.15, center_y + icon_size*0.2], fill=cloud_color)
    draw.ellipse([center_x + icon_size*0.15, center_y, 
                  center_x + icon_size*0.45, center_y + icon_size*0.2], fill=cloud_color)
    
    return img

def main():
    """Tüm ikonları oluştur"""
    assets_dir = os.path.join(os.path.dirname(__file__), '..', 'assets', 'images')
    os.makedirs(assets_dir, exist_ok=True)
    
    print("İkonlar oluşturuluyor...")
    
    # Ana uygulama ikonu
    print("✓ Ana uygulama ikonu (1024x1024)...")
    icon = create_app_icon()
    icon.save(os.path.join(assets_dir, 'icon.png'), 'PNG', optimize=True)
    
    # Android adaptive icon foreground
    print("✓ Android foreground ikonu (1024x1024)...")
    android_fg = create_android_foreground()
    android_fg.save(os.path.join(assets_dir, 'android-icon-foreground.png'), 'PNG', optimize=True)
    
    # Android adaptive icon background
    print("✓ Android background ikonu (1024x1024)...")
    android_bg = create_android_background()
    android_bg.save(os.path.join(assets_dir, 'android-icon-background.png'), 'PNG', optimize=True)
    
    # Android monochrome icon
    print("✓ Android monochrome ikonu (1024x1024)...")
    android_mono = create_android_monochrome()
    android_mono.save(os.path.join(assets_dir, 'android-icon-monochrome.png'), 'PNG', optimize=True)
    
    # Splash screen ikonu
    print("✓ Splash screen ikonu (200x200)...")
    splash = create_splash_icon()
    splash.save(os.path.join(assets_dir, 'splash-icon.png'), 'PNG', optimize=True)
    
    # Favicon
    print("✓ Favicon (32x32)...")
    favicon = create_favicon()
    favicon.save(os.path.join(assets_dir, 'favicon.png'), 'PNG', optimize=True)
    
    print("\n✅ Tüm ikonlar başarıyla oluşturuldu!")
    print(f"📁 Konum: {assets_dir}")

if __name__ == '__main__':
    main()
