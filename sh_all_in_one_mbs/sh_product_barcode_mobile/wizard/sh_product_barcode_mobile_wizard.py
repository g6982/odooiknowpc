# -*- coding: utf-8 -*-
# Copyright (C) Softhealer Technologies.

from odoo import api, fields, models, _


class ShProductBarcodeMobileWizard(models.TransientModel):
    _name = "sh.product.barcode.mobile.wizard"
    _description = "Get Price Mobile Barcode Scanner"

    name = fields.Char(string="Name", default="Product details")

    company_id = fields.Many2one(
        'res.company', string='Company', default=lambda self: self.env.company, required=True)
    post_msg = fields.Html('Message', translate=True,
                           help='Message displayed after having scan product')

    sh_product_barcode_mobile = fields.Char(string="Mobile Barcode")
    sh_product_bm_is_cont_scan = fields.Char(
        string='Continuously Scan?', default=lambda self: self.env.company.sh_product_bm_is_cont_scan if self.env.user and self.env.company else None, readonly=True)

    @api.onchange('sh_product_barcode_mobile')
    def _onchange_sh_product_barcode_mobile(self):

        if self.sh_product_barcode_mobile in ['', "", False, None]:
            return

        code_sound_success = ""
        code_sound_fail = ""
        if self.env.company.sudo().sh_product_bm_is_sound_on_success:
            code_sound_success = "SH_BARCODE_MOBILE_SUCCESS_"

        if self.env.company.sudo().sh_product_bm_is_sound_on_fail:
            code_sound_fail = "SH_BARCODE_MOBILE_FAIL_"

        if self and self.sh_product_barcode_mobile:
            domain = []
            if self.env.company.sudo().sh_product_barcode_mobile_type == "barcode":
                domain = [("barcode", "=", self.sh_product_barcode_mobile)]

            elif self.env.company.sudo().sh_product_barcode_mobile_type == "int_ref":
                domain = [("default_code", "=", self.sh_product_barcode_mobile)]

            elif self.env.company.sudo().sh_product_barcode_mobile_type == "sh_qr_code":
                domain = [("sh_qr_code", "=", self.sh_product_barcode_mobile)]

            elif self.env.company.sudo().sh_product_barcode_mobile_type == "all":
                domain = ["|", "|", ("default_code", "=", self.sh_product_barcode_mobile), (
                    "barcode", "=", self.sh_product_barcode_mobile), ("sh_qr_code", "=", self.sh_product_barcode_mobile)]

            search_product = self.env["product.product"].search(
                domain, limit=1)
            if search_product:
                msg = f'''<div><h4>Product: <font color="red">{search_product.display_name}</font>'''

                if self.env.company.sudo().sh_product_bm_is_default_code:
                    msg += f'''<br/><br/>Internal Reference: <font color="red">{search_product.default_code or ''} </font>'''

                if self.env.company.sudo().sh_product_bm_is_lst_price:
                    msg += f'''<br/><br/>Sale Price: <font color="red">{search_product.lst_price} </font>'''

                if self.env.company.sudo().sh_product_bm_is_qty_available and search_product.type == 'product':
                    msg += f'''<br/><br/>Quantity On Hand: <font color="red">{search_product.qty_available} </font>'''

                if self.env.company.sudo().sh_product_bm_is_virtual_available and search_product.type == 'product':
                    msg += f'''<br/><br/>Forecast Quantity: <font color="red">{search_product.virtual_available} </font>'''
                msg += '''</div></h4>'''

                self.post_msg = msg

                if self.env.company.sudo().sh_product_bm_is_notify_on_success:
                    message = _(code_sound_success +
                                'Product: %s') % (search_product.display_name)
                    self.env['bus.bus']._sendone(self.env.user.partner_id,
                                                 'sh_product_barcode_mobile_notification_info', {'title': _("Succeed"), 'message': message})

            else:
                self.post_msg = False

                if self.env.company.sudo().sh_product_bm_is_notify_on_fail:
                    message = _(
                        code_sound_fail + 'Scanned Internal Reference/Barcode not exist in any product!')
                    self.env['bus.bus']._sendone(self.env.user.partner_id,
                                                 'sh_product_barcode_mobile_notification_danger', {'title': _("Failed"), 'message': message, })
