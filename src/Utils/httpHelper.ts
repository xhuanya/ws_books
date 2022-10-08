/**
 * 获取错误html输出
 * @param title 标题
 * @param content 内容
 * @returns html
 */
export function WriteErrorHtml(title: string, content: string): string {
    return `<html><head><title>${title}</title></head><body><h1 style="TEXT-ALIGN: CENTER;">${content}</h1></body></html>`
}

export function throwError(message: string, status: number) {
    throw { message, status }
}
