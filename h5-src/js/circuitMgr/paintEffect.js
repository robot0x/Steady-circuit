
//连接导线过程显示
Manager.ShowAddLead = function(pos) {
	if (1 != Manager.motiCount) return false;

	var body = Manager.motiBody;

	if (!body || !body.IsOnConnectPos()) return false;

	Manager.PaintAll();		//先刷新
	Manager.motiCount = 1;	//还原变量

	//设置黑色画笔
	Manager.ctx.SelectStockObject(BLACK_PEN);
	
	Manager.ctx.beginPath();
	DPtoLP(pos, Manager.canvas);
	Manager.ctx.moveTo(pos);
	var firstPos = body.GetPosFromBody();
	Manager.ctx.lineTo(firstPos);
	Manager.ctx.stroke();

	return true;
};

//添加物体过程显示
Manager.ShowAddBody = function(point) {
	if (Manager.addState == BODY_CRUN) {
		if (Manager.lastMoveOnPos.x > -100)
			PaintCommonFunc.PaintImageDataXor(Manager.ctx, crunImageData[PAINT_CRUN_STYLE_NORMAL], Manager.lastMoveOnPos.x-DD, Manager.lastMoveOnPos.y-DD);
		
		DPtoLP(point, Manager.canvas);
		Manager.lastMoveOnPos = point;
		
		PaintCommonFunc.PaintImageDataXor(Manager.ctx, crunImageData[PAINT_CRUN_STYLE_NORMAL], Manager.lastMoveOnPos.x-DD, Manager.lastMoveOnPos.y-DD);

		SetCursor(hcAddCrun);
		return true;
	} else if (Pointer.IsCtrl(Manager.addState)) {
		var tempImage = Manager.ctrlImageList[Manager.addState*4];
		
		if (Manager.lastMoveOnPos.x > -100)
			PaintCommonFunc.PaintImageDataXor(Manager.ctx, tempImage, Manager.lastMoveOnPos.x, Manager.lastMoveOnPos.y);
		
		DPtoLP(point, Manager.canvas);
		Manager.lastMoveOnPos = point;
		
		PaintCommonFunc.PaintImageDataXor(Manager.ctx, tempImage, Manager.lastMoveOnPos.x, Manager.lastMoveOnPos.y);

		SetCursor(null);
		return true;
	} else {
		return false;
	}
};

//移动物体过程显示,Manager.lastMoveOnPos.x初始值设为-100,在LButtonDown和PaintAll中设置
Manager.ShowMoveBody = function(pos, isLButtonDown) {
	ASSERT(Manager.motiCount >= 0 && Manager.motiCount <= 2);
	if (Manager.motiCount == 0) return false;

	var body = Manager.motiBody[Manager.motiCount - 1];

	if (!body.IsOnBody()) return false;
	if (!isLButtonDown) {	//鼠标没有按下
		Manager.PaintAll(); 
		return false;
	}

	//获得物体坐标
	DPtoLP(pos, Manager.canvas);
	var bodyPos = {x:body.p.x, y:body.p.y};

	//根据坐标差计算画图坐标
	pos.x += bodyPos.x - Manager.lButtonDownPos.x;
	pos.y += bodyPos.y - Manager.lButtonDownPos.y;

	//清除上次坐标画的物体
	if (Manager.lastMoveOnPos.x > -100)
		PaintInvertBodyAtPos(body, Manager.lastMoveOnPos);

	//在新的坐标物体
	Manager.lastMoveOnPos = pos;	//获得新的坐标
	PaintInvertBodyAtPos(body, Manager.lastMoveOnPos);

	//左或右ctrl键被按下相当于复制
	//if (IsCtrlDown()) SetCursor(hcAddCrun);

	return true;
};

//移动导线过程显示
Manager.ShowMoveLead = function(isLButtonDown) {
	ASSERT(Manager.motiCount>=0 && Manager.motiCount<=2);

	if (Manager.motiCount == 0 || !Manager.motiBody[Manager.motiCount-1].IsOnLead()) {
		return false;
	}
	if (!isLButtonDown) {	//鼠标没有按下
		Manager.PaintAll();
		return true;
	}

	if (Manager.motiBody[Manager.motiCount-1].IsOnHoriLead())
		SetCursor(hcMoveHorz);	//在横线,鼠标变成"上下指针"
	else 
		SetCursor(hcMoveVert);	//在竖线,鼠标变成"左右指针"

	return true;
};


//突出右击物体
Manager.PosBodyPaintRect = function(pos) {
	var body = Manager.motiBody[0]

	Manager.motiCount = 0;
	Manager.MotivateAll(pos);
	Manager.motiCount = 0;

	if (!body.IsOnAny()) return BODY_NO;

	if (body.IsOnConnectPos()) body.SetAtState(-1);

	if (body.IsOnBody()) Manager.ctx.SelectObject(hp + BLUE);

	if (body.IsOnCrun()) {
		Manager.ctx.Rectangle(body.p.x-DD-2, body.p.y-DD-2, 
			body.p.x+DD+2, body.p.y+DD+2);
	} else if (body.IsOnCtrl()) {
		Manager.ctx.Rectangle(body.p.x-2, body.p.y-2, 
			body.p.x+CTRL_SIZE.cx+2, body.p.y+CTRL_SIZE.cy+2);
	}

	Manager.PaintWithSpecialColorAndRect(body, false);
	return body.GetStyle();
};


//计算电流后,显示流过物体的电流
Manager.ShowBodyElec = function(body) {
	var pointer = Manager.GetBodyPointer(body);
	if (!pointer.IsOnLead() && !pointer.IsOnCtrl()) return false;	//只显示导线和控件

	var tempStr1;	//字符串
	var tempStr2;	//字符串
	var title;		//窗口标题
	var elec;		//电流大小
	var elecDir;	//电流方向
	var model = null;	//property显示物体的示例
	var list = LISTDATA.CreateNew();	//property显示的数据

	//1,获得电流信息
	if (pointer.IsOnLead()) {
		elec = pointer.p.elec;
		elecDir  = pointer.p.elecDir;
	} else { //if (pointer.IsOnCtrl())
		elec = pointer.p.elec;
		elecDir = pointer.p.elecDir;

		model = Manager.GetCtrlPaintImage(pointer.p);	//示例
	}

	//2,生成LISTDATA
	switch (elecDir) {
	case UNKNOWNELEC:
		list.SetAMember(DATA_TYPE_string, "电流情况 :", "电流没有计算过!");
		break;

	case OPENELEC:
		list.SetAMember(DATA_TYPE_string, "电流情况 :", "没有电流流过, 断路!");
		break;

	case SHORTELEC:
		list.SetAMember(DATA_TYPE_string, "电流情况 :", "线路短路!!!");
		break;

	case UNCOUNTABLEELEC:
		list.SetAMember(DATA_TYPE_string, "电流情况 :", "两条无电阻线路分一段电流,电流无法确定!");
		break;

	case LEFTELEC:
	case RIGHTELEC:
		ASSERT(elec >= 0);	//不会出现负电流

		if (IsFloatZero(elec)) {
			list.SetAMember(DATA_TYPE_string, "电流情况 :", "电流为0");
			break;
		}

		if (pointer.IsOnLead()) {
			tempStr1 = Manager.GetBodyDefaultName(pointer.p.conBody[True1_False0(LEFTELEC != elecDir)]);
			tempStr2 = Manager.GetBodyDefaultName(pointer.p.conBody[True1_False0(LEFTELEC == elecDir)]);

			list.SetAMember(DATA_TYPE_float, DATA_NOTE[DATA_NOTE_CURRENT], elec);
			list.SetAMember(DATA_TYPE_string, "电流起点 :", tempStr1);
			list.SetAMember(DATA_TYPE_string, "电流终点 :", tempStr2);
		} else { //if (pointer.IsOnCtrl())
			switch (pointer.p.dir ^ (True1_False0(RIGHTELEC == elecDir)<<1)) {
			case 0:
				tempStr1 = "从左到右";
				break;
			case 1:
				tempStr1 = "从上到下";
				break;
			case 2:
				tempStr1 = "从右到左";
				break;
			case 3:
				tempStr1 = "从下到上";
				break;
			}

			list.SetAMember(DATA_TYPE_float, DATA_NOTE[DATA_NOTE_CURRENT], elec);
			list.SetAMember(DATA_TYPE_string, "方向 :", tempStr1);
		}
		break;
	}	//switch(elecDir)

	//3,生成窗口标题
	title =  "流过" + Manager.GetBodyDefaultName(pointer) + "的电流";

	//4,显示对话框
	Manager.PaintWithSpecialColorAndRect(pointer, false);
	//var dlg = MyPropertyDlg.CreateNew(list, true, model, title, Manager.canvas);
	//dlg.DoModal();
	var as = "";
	for (var i=0; i<list.noteTextList.length; ++i) {
		as += (list.noteTextList[i] + list.memberNameList[i] + "\n");
	}
	alert(as);

	return true;
};
