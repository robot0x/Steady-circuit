
//添加物体
Manager.AddBody = function(pos) {
	var temp = Manager.addState;
	Manager.addState = BODY_NO;	//不再添加物体

	if (BODY_CRUN == temp) {
		if (Manager.crun.length >= MAX_CRUN_COUNT) {
			swal({text:"结点超过最大数量!", title:"结点添加失败!", type:"warning"});
			return false;
		}

		Manager.AddCrun(pos);				//编辑函数
		return true;
	} else if (IsBodyTypeCtrl(temp)) {
		if (Manager.ctrl.length >= MAX_CTRL_COUNT) {
			swal({text:"电学元件超过最大数量!", title:"电学元件添加失败!", type:"warning"});
			return false;
		}

		Manager.AddCtrl(pos, temp);			//编辑函数
		return true;
	} else {
		return false;
	}
};

//显示和改变物体属性
Manager.Property = function(body, isReadOnly) {
	var tempStr;
	var list = new LISTDATA();
	var model = null;
	var pointer = Manager.GetBodyPointer(body);

	if (pointer.IsOnLead()) {
		tempStr = Manager.GetBodyDefaultName(pointer) + " 的颜色";	//窗口标题
		pointer.p.GetDataList(list, tempStr);	//数据
	} else if (pointer.IsOnCrun()) {
		tempStr = Manager.GetBodyDefaultName(pointer)  + " 的标签";	//窗口标题
		pointer.p.GetDataList(list);				//数据
		model = "crunImg";					//示例
	} else if (pointer.IsOnCtrl()) {
		tempStr = Manager.GetBodyDefaultName(pointer) + " 的标签和电学属性";	//窗口标题
		pointer.p.GetDataList(list);				//数据
		model = Manager.GetCtrlPaintImageId(pointer.p);		//示例
	} else {
		return;
	}

	Manager.PaintWithSpecialColorAndRect(pointer, false);
	var dlg = MyPropertyDlg.Init(list, isReadOnly, model, tempStr, Manager.canvas, null, function(){Manager.PaintAll();});
	dlg.DoModal();
};

//改变电学元件类型
Manager.ChangeCtrlStyle = function(body) {
	var pointer = Manager.GetBodyPointer(body);
	if (!pointer.IsOnCtrl()) return;

	//获得原来类型
	Manager.tmpEditCtrlPreStyle = pointer.p.style;
	Manager.tmpEditCtrlNewStyle = pointer.p.style;
	Manager.tmpEditCtrl = pointer.p;

	//初始化list数据
	var list = new LISTDATA();
	list.SetDataParent(Manager);
	list.SetAEnumMember(CTRL_TYPE_ENUM, "电学元件的类型", "tmpEditCtrlNewStyle");

	//获得窗口标题
	var tempStr = Manager.GetBodyDefaultName(pointer) + " 的类型";

	//改变类型回调
	var changedCallback = function() {
		if (Manager.tmpEditCtrlPreStyle != Manager.tmpEditCtrlNewStyle) {
			swal(
				{
					title: "改变类型会丢失原有电学元件的数据!",
					text: "继续吗?",
					type: "warning",
					showCancelButton: true,
					cancelButtonText: "取消",
					confirmButtonColor: "#DD6B55",
					confirmButtonText: "确定",
					closeOnConfirm: false
				},
				function(isConfirm) {
					if (isConfirm) {
						Manager.tmpEditCtrl.ChangeStyle(Manager.tmpEditCtrlNewStyle);
						Manager.PaintAll();
						swal({title:"已修改", type:"success"});
					}
				}
			);
		}
	};
	
	//显示对话框
	Manager.PaintWithSpecialColorAndRect(pointer, false);
	var dlg = MyPropertyDlg.Init(list, false, Manager.GetCtrlPaintImageId(pointer.p), tempStr, Manager.canvas, changedCallback, function(){Manager.PaintAll();});
	dlg.DoModal();
};

//移动物体
Manager.PosBodyMove = function(body, firstPos, lastPos) {
	var i;
	var inter = {};

	//获得相对坐标
	inter.x = lastPos.x - firstPos.x;
	inter.y = lastPos.y - firstPos.y;
	if (inter.x==0 && inter.y==0) return;

	ASSERT(body.IsOnBody());
	if (body.IsOnCrun()) {
		body.p.x += inter.x;
		body.p.y += inter.y;
		for (i=0; i<4; ++i) if (body.p.lead[i])
			body.p.lead[i].RefreshPos();
	} else { //if (body.IsOnCtrl())
		body.p.x += inter.x;
		body.p.y += inter.y;
		for (i=0; i<2; ++i) if (body.p.lead[i])
			body.p.lead[i].RefreshPos();
	}
};

//在指定位置复制物体
Manager.PosBodyClone = function(body, firstPos, lastPos) {
	//获得相对坐标
	var inter = {};
	inter.x = lastPos.x - firstPos.x;
	inter.y = lastPos.y - firstPos.y;

	//复制
	if (body.IsOnCrun()) {
		//验证
		if (Manager.crun.length >= MAX_CRUN_COUNT) {
			swal({text:"结点超过最大数量!", title:"结点添加失败!", type:"warning"});
			return false;
		}

		//编辑电路
		var newElement = body.p.Clone(CLONE_FOR_USE);
		newElement.x += inter.x;
		newElement.y += inter.y;
		newElement.index = Manager.crun.length;
		Manager.crun.push(newElement);

		//重绘电路
		Manager.PaintCrun(newElement, true);
	} else { //if (body.IsOnCtrl())
		//验证
		if (Manager.ctrl.length >= MAX_CTRL_COUNT) {
			swal({text:"电学元件超过最大数量!", title:"电学元件添加失败!", type:"warning"});
			return false;
		}

		//编辑部分
		var newElement = body.p.Clone(CLONE_FOR_USE);
		newElement.x += inter.x;
		newElement.y += inter.y;
		newElement.index = Manager.ctrl.length;
		Manager.ctrl.push(newElement);

		//重绘电路
		Manager.PaintCtrl(newElement, true);
	}

	return true;
};

//旋转控件
Manager.RotateCtrl = function(body, rotateAngle) {
	var pointer = Manager.GetBodyPointer(body);
	if (!pointer.IsOnCtrl()) return;
	pointer.p.Rotate(rotateAngle);
};
