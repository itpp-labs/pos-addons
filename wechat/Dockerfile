# Use this docker for development
FROM itprojectsllc/install-odoo:12.0-dev

USER root

RUN pip install wechatpy[cryptography]
RUN pip install wdb requests-mock # those are included in base image now and can be removed
RUN pip install python-alipay-sdk  # it's for alipay modules, but we install it here for convinience

USER odoo
