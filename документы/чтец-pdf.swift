// Постраничный разбор PDF: текст и доля закрашенного.
//
// Нужен для двух вещей. Первая — узнать, на какой лист лёг раздел, чтобы
// проставить номера в оглавлении. Вторая — поймать пустую страницу:
// по одному тексту её не отличить от страницы с крупным рисунком и короткой
// подписью, а по доле краски — отличить сразу.
//
// Отдельная утилита, потому что pdftotext на машине сборки нет, а PDFKit
// есть в самой системе — ставить ради этого целый пакет незачем.
//
//     swiftc -O чтец-pdf.swift -o чтец-pdf
//     ./чтец-pdf документ.pdf          → [{"текст": …, "краска": 0.07}, …]
import Foundation
import PDFKit
import AppKit

let аргументы = CommandLine.arguments
guard аргументы.count >= 2,
      let документ = PDFDocument(url: URL(fileURLWithPath: аргументы[1])) else {
    FileHandle.standardError.write("не открылся PDF\n".data(using: .utf8)!)
    exit(1)
}

/// Доля точек, заметно отличающихся от белого. Считаем по уменьшенному кадру:
/// для «пусто или нет» этого с запасом, а полный размер считался бы долго.
func краска(_ страница: PDFPage) -> Double {
    let рамка = страница.bounds(for: .mediaBox)
    let ш = 150, в = Int(150.0 * рамка.height / рамка.width)
    guard let контекст = CGContext(data: nil, width: ш, height: в,
                                   bitsPerComponent: 8, bytesPerRow: ш * 4,
                                   space: CGColorSpaceCreateDeviceRGB(),
                                   bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)
    else { return 0 }
    контекст.setFillColor(CGColor(red: 1, green: 1, blue: 1, alpha: 1))
    контекст.fill(CGRect(x: 0, y: 0, width: ш, height: в))
    контекст.scaleBy(x: Double(ш) / рамка.width, y: Double(в) / рамка.height)
    контекст.translateBy(x: -рамка.origin.x, y: -рамка.origin.y)
    страница.draw(with: .mediaBox, to: контекст)

    guard let данные = контекст.data else { return 0 }
    let точки = данные.bindMemory(to: UInt8.self, capacity: ш * в * 4)
    var закрашено = 0
    for i in stride(from: 0, to: ш * в * 4, by: 4) {
        let яркость = (Int(точки[i]) + Int(точки[i + 1]) + Int(точки[i + 2])) / 3
        if яркость < 240 { закрашено += 1 }
    }
    return Double(закрашено) / Double(ш * в)
}

var листы: [[String: Any]] = []
for i in 0..<документ.pageCount {
    guard let страница = документ.page(at: i) else { continue }
    листы.append(["текст": страница.string ?? "", "краска": краска(страница)])
}
FileHandle.standardOutput.write(try! JSONSerialization.data(withJSONObject: листы))
