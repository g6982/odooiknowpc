# -*- coding: utf-8 -*-
# Copyright (C) Softhealer Technologies.

from odoo import models, fields, api, _, Command


class AccountMove(models.Model):
    _inherit = "account.move"

    sh_invoice_barcode_mobile = fields.Char(string="Mobile Barcode")

    sh_invoice_bm_is_cont_scan = fields.Char(
        string='Continuously Scan?',
        default=lambda self: self.env.company.sh_invoice_bm_is_cont_scan,
        readonly=True)

    @api.onchange('sh_invoice_barcode_mobile')
    def _onchange_sh_invoice_barcode_mobile(self):
        if self.sh_invoice_barcode_mobile in ['', "", False, None]:
            return

        code_sound_success = ""
        code_sound_fail = ""
        if self.env.company.sudo().sh_invoice_bm_is_sound_on_success:
            code_sound_success = "SH_BARCODE_MOBILE_SUCCESS_"

        if self.env.company.sudo().sh_invoice_bm_is_sound_on_fail:
            code_sound_fail = "SH_BARCODE_MOBILE_FAIL_"

        if self and self.state != "draft":
            selections = self.fields_get()["state"]["selection"]
            value = next((v[1] for v in selections if v[0] == self.state),
                         self.state)

            if self.env.company.sudo().sh_invoice_bm_is_notify_on_fail:
                message = _(code_sound_fail +
                            'You can not scan item in %s state.') % (value)
                self.env['bus.bus']._sendone(self.env.user.partner_id, 'sh_invoice_barcode_mobile_notification_danger', {'title': _("Failed"),
                                                                                                                         'message': message})
            return

        # step 2 increaset product qty by 1 if product not in order line than create new order line.
        elif self:
            self.invoice_line_ids = self.invoice_line_ids.with_context(
                check_move_validity=False)

            search_lines = False
            domain = []
            if self.env.company.sudo().sh_invoice_barcode_mobile_type == "barcode":
                search_lines = self.invoice_line_ids.filtered(
                    lambda ol: ol.product_id.barcode == self.sh_invoice_barcode_mobile)
                domain = [("barcode", "=", self.sh_invoice_barcode_mobile)]

            elif self.env.company.sudo().sh_invoice_barcode_mobile_type == "int_ref":
                search_lines = self.invoice_line_ids.filtered(
                    lambda ol: ol.product_id.default_code == self.sh_invoice_barcode_mobile)
                domain = [("default_code", "=", self.sh_invoice_barcode_mobile)]

            elif self.env.company.sudo().sh_invoice_barcode_mobile_type == "sh_qr_code":
                search_lines = self.invoice_line_ids.filtered(
                    lambda ol: ol.product_id.sh_qr_code == self.sh_invoice_barcode_mobile)
                domain = [("sh_qr_code", "=", self.sh_invoice_barcode_mobile)]

            elif self.env.company.sudo().sh_invoice_barcode_mobile_type == "all":
                search_lines = self.invoice_line_ids.filtered(lambda ol: self.sh_invoice_barcode_mobile in (ol.product_id.barcode,
                                                                                                            ol.product_id.default_code,
                                                                                                            ol.product_id.sh_qr_code))
                domain = ["|", "|", ("default_code", "=", self.sh_invoice_barcode_mobile), (
                    "barcode", "=", self.sh_invoice_barcode_mobile), ("sh_qr_code", "=", self.sh_invoice_barcode_mobile)]

            if search_lines:
                for line in search_lines:
                    line.quantity += 1

                    if self.env.company.sudo().sh_invoice_bm_is_notify_on_success:
                        message = _(
                            code_sound_success + 'Product: %s Qty: %s') % (line.product_id.name, line.quantity)
                        self.env['bus.bus']._sendone(self.env.user.partner_id, 'sh_invoice_barcode_mobile_notification_info', {'title': _("Succeed"),
                                                                                                                               'message': message})
                    break
            else:
                search_product = self.env["product.product"].search(
                    domain, limit=1)
                if search_product:
                    self.invoice_line_ids = [Command.create({'product_id': search_product.id,
                                                             # "name": search_product.name,
                                                             "quantity": 1,
                                                             # 'move_id': self,
                                                             })]

                    if self.env.company.sudo().sh_invoice_bm_is_notify_on_success:
                        message = _(
                            code_sound_success + 'Product: %s Qty: %s') % (search_product.name, 1)
                        self.env['bus.bus']._sendone(self.env.user.partner_id, 'sh_invoice_barcode_mobile_notification_info', {'title': _("Succeed"),
                                                                                                                               'message': message})
                else:
                    if self.env.company.sudo().sh_invoice_bm_is_notify_on_fail:
                        message = _(
                            code_sound_fail + 'Scanned Internal Reference/Barcode not exist in any product!')
                        self.env['bus.bus']._sendone(self.env.user.partner_id, 'sh_invoice_barcode_mobile_notification_danger', {'title': _("Failed"),
                                                                                                                                 'message': message})
