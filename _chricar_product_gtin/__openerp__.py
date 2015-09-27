{ "name"         : "Product GTIN EAN8 EAN13 UPC JPC Support (OBSOLETE)"
, "version"      : "1.1"
, "author"       : "Camptocamp, IT-Projects LLC, Ivan Yelizariev"
, "website"      : "http://www.camptocamp.com"
, "category"     : "Generic Modules/Others"
, "depends"      : ["product", "point_of_sale"]
, "description"  : """
*This is a frozen version. The module is moved to another repository. Check out newest version here:*  https://github.com/camptocamp/c2c-rd-addons or https://github.com/yelizariev/c2c-rd-addons


Replaces the EAN13 code completion with a checkroutine for EAN13, EAN8, JPC, UPC and GTIN
makes EAN visible in simplified view
"""
, "init_xml"     : []
, "demo_xml"     : []
, "update_xml"   : ["chricar_product_gtin_view.xml", "data.xml"]
, "auto_install" : False
, "installable"  : True
}
