// Постраничный текст PDF, JSON-массивом в stdout.
//
// Нужен ровно для одного: узнать, на какой лист лёг раздел, чтобы
// проставить номера в оглавлении. Отдельная утилита, потому что
// pdftotext на машине сборки нет, а PDFKit есть в самой системе —
// ставить ради одной операции целый пакет незачем.
//
//     swiftc -O чтец-pdf.swift -o чтец-pdf
//     ./чтец-pdf документ.pdf
import Foundation
import PDFKit

let аргументы = CommandLine.arguments
guard аргументы.count >= 2,
      let документ = PDFDocument(url: URL(fileURLWithPath: аргументы[1])) else {
    FileHandle.standardError.write("не открылся PDF\n".data(using: .utf8)!)
    exit(1)
}
var листы: [String] = []
for i in 0..<документ.pageCount {
    листы.append(документ.page(at: i)?.string ?? "")
}
FileHandle.standardOutput.write(try! JSONSerialization.data(withJSONObject: листы))
