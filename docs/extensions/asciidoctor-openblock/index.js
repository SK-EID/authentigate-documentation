// An extension that lets multiple open blocks
// Needed because of this issue https://github.com/asciidoctor/asciidoctor/issues/1121
// Adapted from https://gitlab.com/djencks/asciidoctor-openblock/-/blob/master/lib/openblock.js?ref_type=heads
//
// Usage
//
//   [open]
//   ----
//   Open block that can be nested.
//   [open]
//   ------
//   Second level open block.
//   ------
//   ----
//
'use strict'

module.exports.register = function (registry) {
  registry.block(function () {
    this.named('open')
    this.onContext(['listing', 'paragraph'])
    this.process(function (parent, reader, attrs) {
      const result = this.createOpenBlock(parent, reader.getLines(), attrs)
      return result
    })
  })
}
