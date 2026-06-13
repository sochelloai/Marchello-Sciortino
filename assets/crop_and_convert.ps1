Add-Type -AssemblyName System.Drawing

$spritePath = "c:\Users\soche\OneDrive\Desktop\Marchello Sciortino\assets\logo-sprite.png"
$lightPath = "c:\Users\soche\OneDrive\Desktop\Marchello Sciortino\assets\logo-light.png"
$darkPath = "c:\Users\soche\OneDrive\Desktop\Marchello Sciortino\assets\logo-dark.png"

# Load original sprite
$img = [System.Drawing.Bitmap]::FromFile($spritePath)

# Define crop bounds (Left=16, Top=10, Width=913, Height=114)
$rect = New-Object System.Drawing.Rectangle(16, 10, 913, 114)

# Create cropped bitmap for light logo
$bmpLight = New-Object System.Drawing.Bitmap(913, 114)
$gLight = [System.Drawing.Graphics]::FromImage($bmpLight)
$gLight.DrawImage($img, 0, 0, $rect, [System.Drawing.GraphicsUnit]::Pixel)
$gLight.Dispose()

# Save cropped light logo
$bmpLight.Save($lightPath, [System.Drawing.Imaging.ImageFormat]::Png)
Write-Host "Successfully generated logo-light.png"

# Create dark logo by color-converting the white text to dark navy (#071827)
$bmpDark = New-Object System.Drawing.Bitmap(913, 114)
for ($y = 0; $y -lt 114; $y++) {
    for ($x = 0; $x -lt 913; $x++) {
        $pixel = $bmpLight.GetPixel($x, $y)
        if ($pixel.A -gt 0) {
            # White/gray text has high Red (e.g. > 100), teal bar has low Red (< 100)
            if ($pixel.R -ge 100) {
                # Convert to dark navy, preserving original alpha for anti-aliasing
                $newColor = [System.Drawing.Color]::FromArgb($pixel.A, 7, 24, 39)
                $bmpDark.SetPixel($x, $y, $newColor)
            } else {
                # Keep teal bar or other colors as is
                $bmpDark.SetPixel($x, $y, $pixel)
            }
        } else {
            $bmpDark.SetPixel($x, $y, $pixel)
        }
    }
}

# Save dark logo
$bmpDark.Save($darkPath, [System.Drawing.Imaging.ImageFormat]::Png)
Write-Host "Successfully generated logo-dark.png"

# Dispose images
$bmpLight.Dispose()
$bmpDark.Dispose()
$img.Dispose()
