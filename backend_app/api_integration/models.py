from mongoengine import (
                            Document, 
                            StringField, 
                            BooleanField, 
                            DateTimeField, 
                            IntField, 
                            DateTimeField, 
                            BooleanField, 
                            StringField, 
                            DateTimeField, 
                            BooleanField, 
                            StringField, 
                            DateTimeField,
                            ListField,
                            DynamicField,
                            FloatField,
                        )


class ZohoSalesOrder(Document):
    salesorder_id = StringField(max_length=255, unique=True)
    salesorder_number = StringField(max_length=255, null=True)
    date = DateTimeField(null=True) 
    status = StringField(max_length=100, null=True)
    customer_id = StringField(max_length=255, null=True)
    customer_name = StringField(max_length=255, null=True)
    is_taxable = BooleanField(default=True)
    tax_id = StringField(max_length=255, null=True)
    tax_name = StringField(max_length=255, null=True)
    tax_percentage = FloatField(null=True)
    currency_id = StringField(max_length=255, null=True)
    currency_code = StringField(max_length=10, null=True)
    currency_symbol = StringField(max_length=5, null=True)
    exchange_rate = FloatField(default=1.0, null=True)
    delivery_method = StringField(max_length=255, null=True)
    total_quantity = FloatField(default=0, null=True)
    sub_total = FloatField(default=0, null=True)
    tax_total = FloatField(default=0, null=True)
    total = FloatField(default=0, null=True)
    created_by_email = StringField(max_length=255, null=True) 
    created_by_name = StringField(max_length=255, null=True)
    salesperson_id = StringField(max_length=255, null=True)
    salesperson_name = StringField(max_length=255, null=True)
    is_test_order = BooleanField(default=False)
    notes = StringField(null=True) 
    payment_terms = IntField(default=0)
    payment_terms_label = StringField(max_length=255, null=True)

    # JSONFields
    line_items = ListField(DynamicField(), default=list, null=True)
    shipping_address = DynamicField(null=True)
    billing_address = DynamicField(null=True)
    warehouses = ListField(DynamicField(), default=list, null=True)
    custom_fields = ListField(DynamicField(), default=list, null=True)
    order_sub_statuses = ListField(DynamicField(), default=list, null=True)
    shipment_sub_statuses = ListField(DynamicField(), default=list, null=True)

    created_time = DateTimeField(null=True)
    last_modified_time = DateTimeField(null=True)
    reference_number = StringField(max_length=255, null=True)

    meta = {
        'collection': 'zoho_inventory_shipment_sales_order',
        'indexes': [
            'salesorder_id', 'salesorder_number'
        ],
        'verbose_name': 'Zoho Inventory Sales Order',
        'verbose_name_plural': 'Zoho Inventory Sales Orders'
    }

    def __str__(self):
        return f"Sales Order {self.salesorder_number} - {self.customer_name}"
    
    
class ZohoCustomer(Document):
    contact_id = StringField(max_length=255, unique=True, required=True)
    contact_name = StringField(max_length=255, required=True)
    customer_name = StringField(max_length=255, required=True)
    company_name = StringField(max_length=255, null=True)
    status = StringField(max_length=255, required=True)
    first_name = StringField(max_length=255, required=True)
    last_name = StringField(max_length=255, required=True)
    email = StringField(max_length=255, required=True)
    phone = StringField(max_length=255, required=True)
    mobile = StringField(max_length=255, null=True)
    created_time = DateTimeField(required=True)
    created_time_formatted = StringField(max_length=255, required=True)
    last_modified_time = DateTimeField(required=True)
    last_modified_time_formatted = StringField(max_length=255, required=True)
    qb_list_id = StringField(max_length=255, null=True)
    
    contact_type = StringField(max_length=50, required=True)
    has_transaction = BooleanField(default=False)
    is_linked_with_zohocrm = BooleanField(default=False)
    website = StringField(max_length=255, null=True)
    primary_contact_id = StringField(max_length=255, null=True)
    payment_terms = IntField(null=True)
    payment_terms_label = StringField(max_length=255, null=True)
    currency_id = IntField(null=True)
    currency_code = StringField(max_length=10, null=True)
    currency_symbol = StringField(max_length=10, null=True)
    outstanding_receivable_amount = FloatField(default=0.0)
    outstanding_receivable_amount_bcy = FloatField(default=0.0)
    unused_credits_receivable_amount = FloatField(default=0.0)
    unused_credits_receivable_amount_bcy = FloatField(default=0.0)
    facebook = StringField(max_length=255, null=True)
    twitter = StringField(max_length=255, null=True)
    payment_remainder_enabled = BooleanField(default=False)
    notes = StringField(max_length=1024, null=True)
    is_taxable = BooleanField(default=False)
    tax_id = StringField(null=True)
    tax_name = StringField(max_length=255, null=True)
    tax_percentage = FloatField(null=True)
    tax_authority_id = StringField(null=True)
    tax_exemption_id = StringField(max_length=255, null=True)
    tax_authority_name = StringField(max_length=255, null=True)
    tax_exemption_code = StringField(max_length=255, null=True)
    place_of_contact = StringField(max_length=255, null=True)
    gst_no = StringField(max_length=50, null=True)
    tax_treatment = StringField(max_length=255, null=True)
    tax_regime = StringField(max_length=255, null=True)
    legal_name = StringField(max_length=255, null=True)
    is_tds_applicable = BooleanField(default=False)
    vst_treatment = StringField(max_length=255, null=True)
    gst_treatment = StringField(max_length=255, null=True)
    
    custom_fields = ListField(DynamicField(), default=list)
    billing_address = DynamicField()
    shipping_address = DynamicField()
    contact_persons = ListField(DynamicField(), default=list)
    default_templates = DynamicField()

    meta = {
        'collection': 'zoho_customer',
        'indexes': [
            'contact_id',
            'email',
        ],
        'verbose_name': 'Zoho Books Customer',
        'verbose_name_plural': 'Zoho Books Customers',
        'strict': False  # Permite campos no definidos explícitamente
    }

    def save(self, *args, **kwargs):
        if self.pk:
            return super(ZohoCustomer, self).save(*args, **kwargs)
        else:
            if not ZohoCustomer.objects(contact_id=self.contact_id).first() and not ZohoCustomer.objects(email=self.email).first():
                return super(ZohoCustomer, self).save(*args, **kwargs)
            else:
                # Manejar el caso donde el cliente ya existe
                pass

    def __str__(self):
        return self.contact_name
    
    
